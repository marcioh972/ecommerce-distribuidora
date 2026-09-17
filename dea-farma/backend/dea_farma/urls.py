from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static

admin.site.site_header = "DeA Farma — Administração"
admin.site.site_title = "DeA Farma"
admin.site.index_title = "Painel da distribuidora"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("clientes.urls")),
    path("api/catalogo/", include("catalogo.urls")),
    path("api/marketing/", include("marketing.urls")),
    path("api/pedidos/", include("pedidos.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
