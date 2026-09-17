from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import CadastroClienteSerializer, ClientePerfilSerializer


class CadastroView(APIView):
    """POST /api/auth/cadastro/ — cria usuário + cliente com status 'pendente'."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CadastroClienteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cliente = serializer.save()
        return Response(
            {
                "id": cliente.id,
                "status": cliente.status,
                "mensagem": (
                    "Cadastro recebido! Nossa equipe comercial vai analisar seus documentos. "
                    "Você já pode navegar pelo catálogo e a compra será liberada assim que o "
                    "cadastro for aprovado."
                ),
            },
            status=status.HTTP_201_CREATED,
        )


class MeuPerfilView(APIView):
    """GET /api/auth/eu/ — perfil, status de cadastro e permissão de compra."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = ClientePerfilSerializer(request.user.cliente)
        return Response(serializer.data)


class LoginView(TokenObtainPairView):
    """POST /api/auth/token/ — aceita e-mail no lugar de username."""

    def post(self, request, *args, **kwargs):
        dados = request.data.copy()
        if "email" in dados and "username" not in dados:
            dados["username"] = dados["email"]
        request._full_data = dados
        return super().post(request, *args, **kwargs)
