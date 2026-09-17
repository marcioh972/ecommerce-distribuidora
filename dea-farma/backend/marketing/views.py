from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions, viewsets

from .models import Banner, Promocao
from .serializers import BannerSerializer, PromocaoSerializer


class BannerViewSet(viewsets.ReadOnlyModelViewSet):
    """Banners vigentes para o carrossel da home."""

    serializer_class = BannerSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        agora = timezone.now()
        return Banner.objects.filter(ativo=True, inicio__lte=agora).filter(
            Q(fim__isnull=True) | Q(fim__gte=agora)
        ).order_by("ordem", "id")


class PromocaoViewSet(viewsets.ReadOnlyModelViewSet):
    """Promoções vigentes (somente leitura pública)."""

    serializer_class = PromocaoSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        agora = timezone.now()
        return (
            Promocao.objects.filter(ativo=True, inicio__lte=agora, fim__gte=agora)
            .prefetch_related("produtos")
            .order_by("-inicio")
        )
