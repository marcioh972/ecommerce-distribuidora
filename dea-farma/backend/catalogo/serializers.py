from decimal import Decimal

from rest_framework import serializers

from marketing.models import promocoes_vigentes_para
from .models import Categoria, ImagemProduto, Laboratorio, Produto


class CategoriaSerializer(serializers.ModelSerializer):
    subcategorias = serializers.SlugRelatedField(slug_field="slug", many=True, read_only=True)

    class Meta:
        model = Categoria
        fields = ["id", "nome", "slug", "icone", "subcategorias"]


class LaboratorioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Laboratorio
        fields = ["id", "nome", "slug"]


class ImagemSerializer(serializers.ModelSerializer):
    url = serializers.ImageField(source="imagem", read_only=True)

    class Meta:
        model = ImagemProduto
        fields = ["url", "alt", "ordem"]


class ProdutoListSerializer(serializers.ModelSerializer):
    laboratorio = LaboratorioSerializer(read_only=True)
    imagem = serializers.SerializerMethodField()
    preco_promocional = serializers.SerializerMethodField()
    percentual_desconto = serializers.SerializerMethodField()
    em_estoque = serializers.SerializerMethodField()

    class Meta:
        model = Produto
        fields = [
            "id", "nome", "slug", "principio_ativo", "laboratorio", "tipo", "prescricao",
            "preco_unidade", "preco_caixa", "qtd_por_caixa", "preco_promocional",
            "percentual_desconto", "em_estoque", "imagem",
        ]

    def get_imagem(self, obj):
        primeira = obj.imagens.first()
        request = self.context.get("request")
        if primeira and primeira.imagem:
            url = primeira.imagem.url
            return request.build_absolute_uri(url) if request else url
        return None

    def _promo(self, obj):
        promos = getattr(obj, "_promos_cache", None)
        if promos is None:
            promos = promocoes_vigentes_para(obj)
        return promos[0] if promos else None

    def get_preco_promocional(self, obj):
        promo = self._promo(obj)
        if not promo:
            return None
        return promo.preco_com_desconto(obj.preco_unidade).quantize(Decimal("0.01"))

    def get_percentual_desconto(self, obj):
        promo = self._promo(obj)
        if not promo:
            return None
        if promo.tipo == "percentual":
            return float(promo.valor)
        if obj.preco_unidade:
            return round(float(promo.valor) / float(obj.preco_unidade) * 100, 1)
        return None

    def get_em_estoque(self, obj):
        return obj.estoque_total > 0


class ProdutoDetalheSerializer(ProdutoListSerializer):
    imagens = ImagemSerializer(many=True, read_only=True)
    categoria = CategoriaSerializer(read_only=True)
    faixas = serializers.SerializerMethodField()

    class Meta(ProdutoListSerializer.Meta):
        fields = ProdutoListSerializer.Meta.fields + [
            "ean", "categoria", "imagens", "faixas", "estoque_minimo", "criado_em",
        ]

    def get_faixas(self, obj):
        return [
            {
                "quantidade_minima": f.quantidade_minima,
                "preco_unidade": f.preco_unidade,
                "preco_caixa": f.preco_caixa,
            }
            for f in obj.faixas.all()
        ]
