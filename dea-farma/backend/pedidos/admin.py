from django.contrib import admin

from .models import ItemPedido, Pedido


class ItemInline(admin.TabularInline):
    model = ItemPedido
    extra = 0
    readonly_fields = ["subtotal"]


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ["numero", "cliente", "status", "forma_pagamento", "total", "criado_em"]
    list_filter = ["status", "forma_pagamento"]
    search_fields = ["numero", "cliente__razao_social", "cliente__nome_fantasia"]
    readonly_fields = ["numero", "subtotal", "desconto", "total"]
    inlines = [ItemInline]
    actions = ["marcar_em_separacao", "marcar_faturado", "marcar_enviado", "marcar_entregue", "cancelar"]

    @admin.action(description="Marcar como 'Em separação'")
    def marcar_em_separacao(self, request, queryset):
        queryset.update(status=Pedido.Status.EM_SEPARACAO)

    @admin.action(description="Marcar como 'Faturado'")
    def marcar_faturado(self, request, queryset):
        queryset.update(status=Pedido.Status.FATURADO)

    @admin.action(description="Marcar como 'Enviado'")
    def marcar_enviado(self, request, queryset):
        queryset.update(status=Pedido.Status.ENVIADO)

    @admin.action(description="Marcar como 'Entregue'")
    def marcar_entregue(self, request, queryset):
        queryset.update(status=Pedido.Status.ENTREGUE)

    @admin.action(description="Cancelar pedidos selecionados")
    def cancelar(self, request, queryset):
        queryset.update(status=Pedido.Status.CANCELADO)
