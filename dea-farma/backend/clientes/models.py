import re

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import models


def apenas_digitos(valor: str) -> str:
    return re.sub(r"\D", "", valor or "")


def validar_cnpj(cnpj: str) -> str:
    """Valida dígitos verificadores do CNPJ e retorna somente números."""
    cnpj = apenas_digitos(cnpj)
    if len(cnpj) != 14 or len(set(cnpj)) == 1:
        raise ValidationError("CNPJ inválido.")
    pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    pesos2 = [6] + pesos1
    for pesos, pos in ((pesos1, 12), (pesos2, 13)):
        soma = sum(int(cnpj[i]) * pesos[i] for i in range(pos))
        digito = (soma % 11)
        digito = 0 if digito < 2 else 11 - digito
        if digito != int(cnpj[pos]):
            raise ValidationError("CNPJ inválido.")
    return cnpj


class Cliente(models.Model):
    class Status(models.TextChoices):
        PENDENTE = "pendente", "Pendente"
        APROVADO = "aprovado", "Aprovado"
        RECUSADO = "recusado", "Recusado"
        INATIVO = "inativo", "Inativo"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="cliente")
    razao_social = models.CharField("razão social", max_length=200)
    nome_fantasia = models.CharField("nome fantasia", max_length=200, blank=True)
    cnpj = models.CharField("CNPJ", max_length=14, unique=True, validators=[validar_cnpj])
    inscricao_estadual = models.CharField("inscrição estadual", max_length=20, blank=True)
    telefone = models.CharField(max_length=20)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDENTE)
    motivo_recusa = models.TextField(blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["razao_social"]

    def __str__(self):
        return self.nome_fantasia or self.razao_social


class Endereco(models.Model):
    class Tipo(models.TextChoices):
        ENTREGA = "entrega", "Entrega"
        FATURAMENTO = "faturamento", "Faturamento"

    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name="enderecos")
    tipo = models.CharField(max_length=12, choices=Tipo.choices, default=Tipo.ENTREGA)
    cep = models.CharField("CEP", max_length=9)
    logradouro = models.CharField(max_length=200)
    numero = models.CharField(max_length=20)
    complemento = models.CharField(max_length=100, blank=True)
    bairro = models.CharField(max_length=100)
    cidade = models.CharField(max_length=100)
    uf = models.CharField("UF", max_length=2)

    class Meta:
        ordering = ["tipo", "id"]

    def __str__(self):
        return f"{self.get_tipo_display()}: {self.logradouro}, {self.numero} — {self.cidade}/{self.uf}"


class Contato(models.Model):
    class Funcao(models.TextChoices):
        COMPRADOR = "comprador", "Comprador"
        FARMACEUTICO = "farmaceutico", "Farmacêutico responsável"
        OUTRO = "outro", "Outro"

    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name="contatos")
    funcao = models.CharField(max_length=15, choices=Funcao.choices)
    nome = models.CharField(max_length=150)
    email = models.EmailField(blank=True)
    telefone = models.CharField(max_length=20)
    cpf = models.CharField("CPF", max_length=11, blank=True)
    registro_crf = models.CharField("CRF", max_length=20, blank=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.nome} ({self.get_funcao_display()})"


class DocumentoCliente(models.Model):
    class Tipo(models.TextChoices):
        ALVARA = "alvara", "Alvará Sanitário"
        CRF = "crf", "CRF"
        CONTRATO_SOCIAL = "contrato_social", "Contrato Social"
        OUTRO = "outro", "Outro"

    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name="documentos")
    tipo = models.CharField(max_length=20, choices=Tipo.choices)
    arquivo = models.FileField(upload_to="documentos/clientes/%Y/%m/")
    enviado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.cliente} — {self.get_tipo_display()}"
