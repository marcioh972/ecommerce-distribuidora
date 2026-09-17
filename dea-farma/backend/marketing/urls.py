from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BannerViewSet, PromocaoViewSet

router = DefaultRouter()
router.register("banners", BannerViewSet, basename="banner")
router.register("promocoes", PromocaoViewSet, basename="promocao")

urlpatterns = [path("", include(router.urls))]
