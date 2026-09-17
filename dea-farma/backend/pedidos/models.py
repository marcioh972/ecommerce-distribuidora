from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import models


class Pedido(models.Model):
    class Status(models.TextChoices):
        RECEBIDO = "recebido", "Recebido"
        EM_SEPARACAO = "em_separacao", "Em separação"
        FATURADO = "faturado", "Faturado"
        ENVIADO = "enviado", "Enviado"
        ENTREGUE = "entregue", "Entregue"
        CANCELADO = "cancelado", "Cancelado"

    class FormaPagamento(models.TextChoices):
        BOLETO = "boleto", "Boleto bancário"
        PIX = "pix", "PIX"
        CARTEIRA = "carteira", "Carnê / carteira"
        DEPOSITO = "deposito", "Depósito antecipado"

    numero = models.PositiveIntegerField(unique=True, editable=False)
    cliente = models.ForeignKey("clientes.Cliente", on_delete=models.PROTECT, related_name="pedidos")
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.RECEBIDO)
    forma_pagamento = models.CharField(max_length=12, choices=FormaPagamento.choices)
    endereco_entrega = models.ForeignKey(
        "clientes.Endereco", on_delete=models.PROTECT, related_name="pedidos_entregues"
    )
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    desconto = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    observacoes = models.TextField(blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criado_em"]

    def __str__(self):
        return f"Pedido #{self.numero} — {self.cliente}"

    def recalcular_totais(self):
        subtotal = sum(item.subtotal for item in self.itens.all())
        self.subtotal = subtotal
        self.total = subtotal - self.desconto
        if self.total < 0:
            raise ValidationError("Desconto não pode exceder o subtotal do pedido.")


class ItemPedido(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name="itens")
    produto = models.ForeignKey("catalogo.Produto", on_delete=models.PROTECT, related_name="itens_pedido")
    quantidade = models.PositiveIntegerField()
    preco_unidade = models.DecimalField("preço un. congelado", max_digits=10, decimal_places=2)
    preco_caixa = models.DecimalField("preço caixa congelado", max_digits=10, decimal_places=2)
    preco_efetivo = models.DecimalField("preço efetivo un.", max_digits=10, decimal_places=2)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["pedido", "produto"], name="item_unico_por_pedido")
        ]

    def __str__(self):
        return f"{self.quantidade}x {self.produto}"

    @property
    def subtotal(self):
        return (self.preco_efetivo * self.quantidade).quantize(Decimal("0.01"))
