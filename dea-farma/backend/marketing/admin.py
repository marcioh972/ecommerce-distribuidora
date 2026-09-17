from django.contrib import admin

from .models import Banner, Promocao


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ["titulo", "ordem", "ativo", "inicio", "fim", "vigente"]
    list_filter = ["ativo"]
    ordering = ["ordem", "id"]


@admin.register(Promocao)
class PromocaoAdmin(admin.ModelAdmin):
    list_display = ["titulo", "tipo", "valor", "inicio", "fim", "ativo", "vigente"]
    list_filter = ["tipo", "ativo"]
    filter_horizontal = ["produtos", "categorias"]
    date_hierarchy = "inicio"
