from rest_framework import mixins, permissions, viewsets
from rest_framework.exceptions import PermissionDenied

from .models import Pedido
from .serializers import CriarPedidoSerializer, PedidoSerializer


class MeusPedidosViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    """Pedidos do cliente logado: listar, detalhar e criar."""

    permission_classes = [permissions.IsAuthenticated]
    ordering = ["-criado_em"]

    def get_queryset(self):
        return Pedido.objects.filter(cliente=self.request.user.cliente).prefetch_related("itens__produto")

    def get_serializer_class(self):
        return CriarPedidoSerializer if self.action == "create" else PedidoSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["cliente"] = self.request.user.cliente
        return context
