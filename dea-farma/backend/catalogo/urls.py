from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CategoriaViewSet, LaboratorioViewSet, ProdutoViewSet

router = DefaultRouter()
router.register("produtos", ProdutoViewSet, basename="produto")
router.register("categorias", CategoriaViewSet, basename="categoria")
router.register("laboratorios", LaboratorioViewSet, basename="laboratorio")

urlpatterns = [path("", include(router.urls))]
