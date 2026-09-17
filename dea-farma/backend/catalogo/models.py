from django.db import models
from django.db.models import Sum
from django.utils import timezone


class Categoria(models.Model):
    nome = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, related_name="subcategorias",
        null=True, blank=True,
    )
    icone = models.CharField(max_length=60, blank=True, help_text="Nome do ícone usado no frontend")
    ordem = models.PositiveIntegerField(default=0)
    ativo = models.BooleanField(default=True)

    class Meta:
        ordering = ["ordem", "nome"]
        verbose_name_plural = "Categorias"

    def __str__(self):
        return self.nome


class Laboratorio(models.Model):
    nome = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(max_length=170, unique=True)

    class Meta:
        ordering = ["nome"]
        verbose_name_plural = "Laboratórios"

    def __str__(self):
        return self.nome


class Produto(models.Model):
    class Tipo(models.TextChoices):
        GENERICO = "generico", "Genérico"
        SIMILAR = "similar", "Similar"
        REFERENCIA = "referencia", "Referência"

    class Prescricao(models.TextChoices):
        LIVRE = "livre", "Livre"
        COM_PRESCRICAO = "com_prescricao", "Com prescrição"
        CONTROLADO = "controlado", "Controlado"

    nome = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    principio_ativo = models.CharField("princípio ativo", max_length=200)
    categoria = models.ForeignKey(Categoria, on_delete=models.PROTECT, related_name="produtos")
    laboratorio = models.ForeignKey(Laboratorio, on_delete=models.PROTECT, related_name="produtos")
    tipo = models.CharField(max_length=12, choices=Tipo.choices)
    prescricao = models.CharField(max_length=15, choices=Prescricao.choices, default=Prescricao.LIVRE)
    ean = models.CharField("EAN/GTIN", max_length=14, blank=True)
    qtd_por_caixa = models.PositiveIntegerField("unidades por caixa", default=1)
    preco_unidade = models.DecimalField("preço por unidade", max_digits=10, decimal_places=2)
    preco_caixa = models.DecimalField("preço por caixa", max_digits=10, decimal_places=2)
    estoque_minimo = models.PositiveIntegerField(default=0)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["nome"]
        indexes = [models.Index(fields=["slug"]), models.Index(fields=["ativo"])]

    def __str__(self):
        return f"{self.nome} ({self.laboratorio})"

    @property
    def estoque_total(self) -> int:
        hoje = timezone.localdate()
        return (
            self.lotes.filter(validade__gte=hoje).aggregate(total=Sum("quantidade"))["total"] or 0
        )

    def preco_por_quantidade(self, quantidade: int):
        """Retorna (preco_unidade, preco_caixa) vigentes para a quantidade, aplicando faixas."""
        un, cx = self.preco_unidade, self.preco_caixa
        faixas = self.faixas.filter(quantidade_minima__lte=quantidade).order_by("-quantidade_minima")
        if faixas.exists():
            faixa = faixas.first()
            un, cx = faixa.preco_unidade, faixa.preco_caixa
        return un, cx


class FaixaPreco(models.Model):
    """Desconto progressivo: a partir de X unidades, vale outro preço."""

    produto = models.ForeignKey(Produto, on_delete=models.CASCADE, related_name="faixas")
    quantidade_minima = models.PositiveIntegerField()
    preco_unidade = models.DecimalField(max_digits=10, decimal_places=2)
    preco_caixa = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ["quantidade_minima"]
        constraints = [
            models.UniqueConstraint(fields=["produto", "quantidade_minima"], name="faixa_unica_por_qtd")
        ]

    def __str__(self):
        return f"{self.produto} a partir de {self.quantidade_minima} un."


class ImagemProduto(models.Model):
    produto = models.ForeignKey(Produto, on_delete=models.CASCADE, related_name="imagens")
    imagem = models.ImageField(upload_to="produtos/%Y/%m/")
    ordem = models.PositiveIntegerField(default=0)
    alt = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ["ordem", "id"]

    def __str__(self):
        return f"Imagem de {self.produto}"


class LoteEstoque(models.Model):
    produto = models.ForeignKey(Produto, on_delete=models.CASCADE, related_name="lotes")
    numero_lote = models.CharField("número do lote", max_length=40)
    quantidade = models.PositiveIntegerField()
    validade = models.DateField()

    class Meta:
        ordering = ["validade"]
        constraints = [
            models.UniqueConstraint(fields=["produto", "numero_lote"], name="lote_unico_por_produto")
        ]
        verbose_name = "Lote em estoque"
        verbose_name_plural = "Lotes em estoque"

    def __str__(self):
        return f"Lote {self.numero_lote} — {self.produto} (validade {self.validade:%m/%Y})"
