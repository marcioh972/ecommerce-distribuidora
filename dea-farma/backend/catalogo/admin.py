from django.contrib import admin

from .models import Categoria, FaixaPreco, ImagemProduto, Laboratorio, LoteEstoque, Produto


class ImagemInline(admin.TabularInline):
    model = ImagemProduto
    extra = 0


class FaixaInline(admin.TabularInline):
    model = FaixaPreco
    extra = 0


class LoteInline(admin.TabularInline):
    model = LoteEstoque
    extra = 0


@admin.register(Produto)
class ProdutoAdmin(admin.ModelAdmin):
    list_display = ["nome", "laboratorio", "categoria", "tipo", "prescricao", "preco_unidade", "estoque_total", "ativo"]
    list_filter = ["tipo", "prescricao", "ativo", "laboratorio", "categoria"]
    search_fields = ["nome", "principio_ativo", "ean"]
    prepopulated_fields = {"slug": ("nome",)}
    inlines = [ImagemInline, FaixaInline, LoteInline]

    @admin.display(description="Estoque")
    def estoque_total(self, obj):
        return obj.estoque_total


admin.site.register(Categoria)
admin.site.register(Laboratorio)
admin.site.register(LoteEstoque)
