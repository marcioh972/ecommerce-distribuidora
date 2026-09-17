from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class Banner(models.Model):
    titulo = models.CharField(max_length=120)
    subtitulo = models.CharField(max_length=200, blank=True)
    imagem = models.ImageField(upload_to="banners/%Y/%m/", blank=True, null=True)
    link = models.CharField(max_length=255, blank=True, help_text="URL interna, ex.: /produtos?promocao=1")
    cta = models.CharField("texto do botão", max_length=40, blank=True)
    ordem = models.PositiveIntegerField(default=0)
    ativo = models.BooleanField(default=True)
    inicio = models.DateTimeField(default=timezone.now)
    fim = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["ordem", "id"]

    def __str__(self):
        return self.titulo

    @property
    def vigente(self):
        agora = timezone.now()
        return self.ativo and self.inicio <= agora and (self.fim is None or agora <= self.fim)


class Promocao(models.Model):
    class TipoDesconto(models.TextChoices):
        PERCENTUAL = "percentual", "Percentual (%)"
        FIXO = "fixo", "Valor fixo (R$)"

    titulo = models.CharField(max_length=120)
    descricao = models.TextField(blank=True)
    tipo = models.CharField(max_length=12, choices=TipoDesconto.choices)
    valor = models.DecimalField(max_digits=8, decimal_places=2)
    produtos = models.ManyToManyField("catalogo.Produto", related_name="promocoes", blank=True)
    categorias = models.ManyToManyField("catalogo.Categoria", related_name="promocoes", blank=True)
    inicio = models.DateTimeField(default=timezone.now)
    fim = models.DateTimeField()
    ativo = models.BooleanField(default=True)

    class Meta:
        ordering = ["-inicio"]

    def __str__(self):
        return self.titulo

    def clean(self):
        if self.tipo == self.TipoDesconto.PERCENTUAL and self.valor > 100:
            raise ValidationError({"valor": "Desconto percentual não pode exceder 100%."})

    @property
    def vigente(self):
        agora = timezone.now()
        return self.ativo and self.inicio <= agora <= self.fim

    def aplica_em(self, produto) -> bool:
        if not self.vigente:
            return False
        if self.produtos.filter(pk=produto.pk).exists():
            return True
        return self.categorias.filter(pk=produto.categoria_id).exists()

    def preco_com_desconto(self, preco: Decimal) -> Decimal:
        """Preço promocional de UMA unidade, nunca negativo."""
        if self.tipo == self.TipoDesconto.PERCENTUAL:
            desc = preco * (self.valor / Decimal("100"))
        else:
            desc = self.valor
        return max(preco - desc, Decimal("0.01"))


def promocoes_vigentes_para(produto) -> list:
    """Promoções vigentes que alcançam o produto (direta ou via categoria)."""
    agora = timezone.now()
    return [
        p
        for p in Promocao.objects.filter(ativo=True, inicio__lte=agora, fim__gte=agora)
        .prefetch_related("produtos", "categorias")
        if p.aplica_em(produto)
    ]
