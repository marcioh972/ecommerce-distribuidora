from datetime import date

from django.db.models import Sum
from django.db.models.functions import Coalesce
from django_filters import rest_framework as filters

from .models import Produto


class ProdutoFilter(filters.FilterSet):
    """Filtros da vitrine: preço, laboratório, categoria, tipo, prescrição e disponibilidade."""

    preco_min = filters.NumberFilter(field_name="preco_unidade", lookup_expr="gte")
    preco_max = filters.NumberFilter(field_name="preco_unidade", lookup_expr="lte")
    laboratorio = filters.CharFilter(field_name="laboratorio__slug")
    categoria = filters.CharFilter(method="filtrar_categoria")
    tipo = filters.ChoiceFilter(choices=Produto.Tipo.choices)
    prescricao = filters.ChoiceFilter(choices=Produto.Prescricao.choices)
    disponibilidade = filters.ChoiceFilter(
        choices=(("em_estoque", "Em estoque"), ("sob_encomenda", "Sob encomenda")),
        method="filtrar_disponibilidade",
    )
    promocao = filters.BooleanFilter(method="filtrar_promocao")
    busca = filters.CharFilter(method="filtrar_busca")

    class Meta:
        model = Produto
        fields = ["tipo", "prescricao", "laboratorio", "categoria"]

    def filtrar_categoria(self, queryset, name, value):
        # inclui produtos das subcategorias
        return queryset.filter(categoria__slug=value) | queryset.filter(
            categoria__parent__slug=value
        )

    def filtrar_busca(self, queryset, name, value):
        return queryset.filter(
            nome__icontains=value
        ) | queryset.filter(principio_ativo__icontains=value) | queryset.filter(
            laboratorio__nome__icontains=value
        )

    def filtrar_disponibilidade(self, queryset, name, value):
        hoje = date.today()
        com_estoque = (
            queryset.filter(lotes__validade__gte=hoje)
            .annotate(total=Coalesce(Sum("lotes__quantidade"), 0))
            .filter(total__gt=0)
        )
        return com_estoque if value == "em_estoque" else queryset.exclude(pk__in=com_estoque)

    def filtrar_promocao(self, queryset, name, value):
        from marketing.models import Promocao
        from django.utils import timezone

        agora = timezone.now()
        promos = Promocao.objects.filter(ativo=True, inicio__lte=agora, fim__gte=agora)
        qs_promo = queryset.filter(promocoes__in=promos)
        qs_categoria = queryset.filter(categoria__promocoes__in=promos)
        return (qs_promo | qs_categoria).distinct() if value else queryset
