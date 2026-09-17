from decimal import Decimal

from django.db import transaction
from django.db.models import Max
from django.utils import timezone
from rest_framework import serializers

from catalogo.models import Produto
from clientes.models import Endereco
from marketing.models import promocoes_vigentes_para
from .models import ItemPedido, Pedido


class ItemInputSerializer(serializers.Serializer):
    produto = serializers.SlugRelatedField(slug_field="slug", queryset=Produto.objects.filter(ativo=True))
    quantidade = serializers.IntegerField(min_value=1)

    def validate(self, attrs):
        produto, quantidade = attrs["produto"], attrs["quantidade"]
        disponivel = produto.estoque_total
        if quantidade > disponivel:
            raise serializers.ValidationError(
                f"Estoque insuficiente para {produto.nome}: disponíveis {disponivel} unidades."
            )
        return attrs


class CriarPedidoSerializer(serializers.Serializer):
    """Cria o pedido congelando os preços vigentes e baixando o estoque (FEFO)."""

    forma_pagamento = serializers.ChoiceField(choices=Pedido.FormaPagamento.choices)
    endereco_entrega = serializers.PrimaryKeyRelatedField(queryset=Endereco.objects.all())
    itens = ItemInputSerializer(many=True, allow_empty=False)

    def validate_endereco_entrega(self, endereco):
        cliente = self.context["cliente"]
        if endereco.cliente_id != cliente.id:
            raise serializers.ValidationError("Endereço não pertence ao seu cadastro.")
        if endereco.tipo != Endereco.Tipo.ENTREGA:
            raise serializers.ValidationError("O pedido deve usar um endereço de entrega.")
        return endereco

    def validate(self, attrs):
        cliente = self.context["cliente"]
        if cliente.status == cliente.Status.PENDENTE:
            raise serializers.ValidationError(
                "Seu cadastro ainda está em análise pela nossa equipe. "
                "Assim que for aprovado, você poderá finalizar a compra."
            )
        if cliente.status == cliente.Status.RECUSADO:
            motivo = f" Motivo: {cliente.motivo_recusa}" if cliente.motivo_recusa else ""
            raise serializers.ValidationError(
                f"Seu cadastro não foi aprovado.{motivo} Entre em contato com o nosso time comercial."
            )
        if cliente.status == cliente.Status.INATIVO:
            raise serializers.ValidationError(
                "Seu cadastro está inativo. Entre em contato com o nosso time comercial."
            )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        cliente = self.context["cliente"]
        itens_data = validated_data.pop("itens")
        numero = (Pedido.objects.aggregate(m=Max("numero"))["m"] or 0) + 1
        pedido = Pedido.objects.create(numero=numero, cliente=cliente, **validated_data)

        subtotal = Decimal("0")
        for item in itens_data:
            produto, quantidade = item["produto"], item["quantidade"]
            preco_un, preco_cx = produto.preco_por_quantidade(quantidade)
            preco_efetivo = preco_un
            promos = promocoes_vigentes_para(produto)
            if promos:
                preco_efetivo = promos[0].preco_com_desconto(preco_un)
            ItemPedido.objects.create(
                pedido=pedido,
                produto=produto,
                quantidade=quantidade,
                preco_unidade=preco_un,
                preco_caixa=preco_cx,
                preco_efetivo=preco_efetivo,
            )
            subtotal += preco_efetivo * quantidade
            self._baixar_estoque(produto, quantidade)

        pedido.subtotal = subtotal.quantize(Decimal("0.01"))
        pedido.total = pedido.subtotal - pedido.desconto
        pedido.save(update_fields=["subtotal", "total"])
        return pedido

    def _baixar_estoque(self, produto, quantidade):
        restante = quantidade
        for lote in produto.lotes.filter(validade__gte=timezone.localdate()).order_by("validade"):
            if restante <= 0:
                break
            usar = min(lote.quantidade, restante)
            lote.quantidade -= usar
            lote.save(update_fields=["quantidade"])
            restante -= usar


class ItemPedidoSerializer(serializers.ModelSerializer):
    produto_nome = serializers.CharField(source="produto.nome", read_only=True)
    produto_slug = serializers.CharField(source="produto.slug", read_only=True)

    class Meta:
        model = ItemPedido
        fields = ["id", "produto_nome", "produto_slug", "quantidade", "preco_unidade", "preco_caixa", "preco_efetivo", "subtotal"]


class PedidoSerializer(serializers.ModelSerializer):
    itens = ItemPedidoSerializer(many=True, read_only=True)
    cliente_nome = serializers.CharField(source="cliente.nome_fantasia", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    forma_pagamento_display = serializers.CharField(source="get_forma_pagamento_display", read_only=True)

    class Meta:
        model = Pedido
        fields = [
            "id", "numero", "cliente_nome", "status", "status_display", "forma_pagamento",
            "forma_pagamento_display", "subtotal", "desconto", "total", "observacoes",
            "itens", "criado_em",
        ]
        read_only_fields = ["numero", "subtotal", "desconto", "total", "criado_em"]
