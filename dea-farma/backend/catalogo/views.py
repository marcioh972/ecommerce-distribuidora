from django.db.models import Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.response import Response

from .filters import ProdutoFilter
from .models import Categoria, Laboratorio, Produto
from .serializers import (
    CategoriaSerializer,
    LaboratorioSerializer,
    ProdutoDetalheSerializer,
    ProdutoListSerializer,
)


class ProdutoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Produto.objects.filter(ativo=True).select_related(
        "laboratorio", "categoria", "categoria__parent"
    ).prefetch_related("imagens", "faixas", "lotes")
    serializer_class = ProdutoListSerializer
    permission_classes = [permissions.AllowAny]
    filterset_class = ProdutoFilter
    lookup_field = "slug"
    ordering_fields = ["preco_unidade", "nome", "criado_em"]
    ordering = ["nome"]

    def get_serializer_class(self):
        return ProdutoDetalheSerializer if self.action == "retrieve" else ProdutoListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == "list":
            # anota estoque para filtros/ordenação sem N+1
            hoje = timezone.localdate()
            qs = qs.annotate(
                estoque_anotado=Coalesce(Sum("lotes__quantidade"), 0)
            )
        return qs


class CategoriaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Categoria.objects.filter(ativo=True, parent__isnull=True).prefetch_related("subcategorias")
    serializer_class = CategoriaSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class LaboratorioViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Laboratorio.objects.all()
    serializer_class = LaboratorioSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None
