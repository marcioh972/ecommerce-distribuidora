from django.contrib import admin

from .models import Cliente, Contato, DocumentoCliente, Endereco


class EnderecoInline(admin.StackedInline):
    model = Endereco
    extra = 0


class ContatoInline(admin.TabularInline):
    model = Contato
    extra = 0


class DocumentoInline(admin.TabularInline):
    model = DocumentoCliente
    extra = 0


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ["nome_fantasia", "razao_social", "cnpj", "status", "criado_em"]
    list_filter = ["status"]
    search_fields = ["razao_social", "nome_fantasia", "cnpj", "user__email"]
    actions = ["aprovar", "recusar", "inativar"]
    inlines = [EnderecoInline, ContatoInline, DocumentoInline]

    @admin.action(description="Aprovar cadastro dos clientes selecionados")
    def aprovar(self, request, queryset):
        queryset.update(status=Cliente.Status.APROVADO, motivo_recusa="")

    @admin.action(description="Recusar cadastro dos clientes selecionados")
    def recusar(self, request, queryset):
        queryset.update(status=Cliente.Status.RECUSADO)

    @admin.action(description="Inativar clientes selecionados")
    def inativar(self, request, queryset):
        queryset.update(status=Cliente.Status.INATIVO)


admin.site.register(Endereco)
admin.site.register(Contato)
admin.site.register(DocumentoCliente)
