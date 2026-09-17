from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import CadastroView, LoginView, MeuPerfilView

urlpatterns = [
    path("cadastro/", CadastroView.as_view(), name="cadastro"),
    path("token/", LoginView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("eu/", MeuPerfilView.as_view(), name="meu_perfil"),
]
