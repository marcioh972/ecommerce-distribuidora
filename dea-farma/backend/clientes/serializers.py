from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import serializers

from .models import Cliente, Contato, DocumentoCliente, Endereco, apenas_digitos


class EnderecoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Endereco
        fields = ["id", "tipo", "cep", "logradouro", "numero", "complemento", "bairro", "cidade", "uf"]
        extra_kwargs = {"tipo": {"required": True}}


class ContatoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contato
        fields = ["id", "funcao", "nome", "email", "telefone", "cpf", "registro_crf"]


class DocumentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentoCliente
        fields = ["id", "tipo", "arquivo", "enviado_em"]
        read_only_fields = ["enviado_em"]


class ClientePerfilSerializer(serializers.ModelSerializer):
    enderecos = EnderecoSerializer(many=True, read_only=True)
    contatos = ContatoSerializer(many=True, read_only=True)
    documentos = DocumentoSerializer(many=True, read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    pode_comprar = serializers.SerializerMethodField()

    class Meta:
        model = Cliente
        fields = [
            "id", "razao_social", "nome_fantasia", "cnpj", "inscricao_estadual",
            "telefone", "status", "motivo_recusa", "email",
            "pode_comprar", "enderecos", "contatos", "documentos", "criado_em",
        ]

    def get_pode_comprar(self, obj):
        return obj.status == Cliente.Status.APROVADO


class CadastroClienteSerializer(serializers.Serializer):
    """Cadastro multi-etapas: recebe o payload completo e cria usuário + cliente em transação."""

    # etapa 1 — empresa
    razao_social = serializers.CharField(max_length=200)
    nome_fantasia = serializers.CharField(max_length=200, required=False, allow_blank=True)
    cnpj = serializers.CharField(max_length=18)
    inscricao_estadual = serializers.CharField(max_length=20, required=False, allow_blank=True)
    telefone = serializers.CharField(max_length=20)
    # etapa 2 — responsável / acesso
    email = serializers.EmailField()
    senha = serializers.CharField(min_length=8, write_only=True)
    senha_confirmacao = serializers.CharField(min_length=8, write_only=True)
    # etapa 3 — endereços (mínimo 1 entrega; faturamento opcional)
    enderecos = EnderecoSerializer(many=True)
    # etapa 4 — contatos
    contatos = ContatoSerializer(many=True)

    def validate_cnpj(self, value):
        cnpj = apenas_digitos(value)
        if Cliente.objects.filter(cnpj=cnpj).exists():
            raise serializers.ValidationError("Já existe um cadastro com este CNPJ.")
        return cnpj

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("E-mail já cadastrado. Faça login ou recupere a senha.")
        return value.lower()

    def validate(self, attrs):
        if attrs["senha"] != attrs.pop("senha_confirmacao"):
            raise serializers.ValidationError({"senha_confirmacao": "As senhas não coincidem."})
        enderecos = attrs["enderecos"]
        tipos = {e["tipo"] for e in enderecos}
        if "entrega" not in tipos:
            raise serializers.ValidationError(
                {"enderecos": "Informe ao menos um endereço de entrega."}
            )
        if not attrs["contatos"]:
            raise serializers.ValidationError({"contatos": "Informe ao menos um contato."})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        email = validated_data.pop("email")
        senha = validated_data.pop("senha")
        enderecos = validated_data.pop("enderecos")
        contatos = validated_data.pop("contatos")
        validated_data["cnpj"] = apenas_digitos(validated_data["cnpj"])

        user = User.objects.create_user(username=email, email=email, password=senha)
        cliente = Cliente.objects.create(user=user, **validated_data)
        for endereco in enderecos:
            Endereco.objects.create(cliente=cliente, **endereco)
        for contato in contatos:
            Contato.objects.create(cliente=cliente, **contato)
        return cliente
