import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from .models import Cliente, validar_cnpj

pytestmark = pytest.mark.django_db

CNPJ_VALIDO = "11222333000181"  # dígitos verificadores conferem com o algoritmo


def payload_cadastro(**over):
    dados = {
        "razao_social": "Farmácia Exemplo Ltda",
        "nome_fantasia": "Farmácia Exemplo",
        "cnpj": CNPJ_VALIDO,
        "telefone": "(11) 4000-0000",
        "email": "compras@farmaciaexemplo.com.br",
        "senha": "senha-segura-123",
        "senha_confirmacao": "senha-segura-123",
        "enderecos": [{
            "tipo": "entrega", "cep": "01310-100", "logradouro": "Av. Paulista",
            "numero": "1000", "bairro": "Bela Vista", "cidade": "São Paulo", "uf": "SP",
        }],
        "contatos": [{
            "funcao": "comprador", "nome": "Maria Silva",
            "email": "maria@farmaciaexemplo.com.br", "telefone": "(11) 99999-0000",
        }],
    }
    dados.update(over)
    return dados


def test_cnpj_invalido_rejeitado():
    with pytest.raises(Exception):
        validar_cnpj("11222333000100")


def test_cadastro_cria_cliente_pendente():
    resp = APIClient().post("/api/auth/cadastro/", payload_cadastro(), format="json")
    assert resp.status_code == 201
    cliente = Cliente.objects.get()
    assert cliente.status == Cliente.Status.PENDENTE
    assert resp.data["status"] == "pendente"


def test_cadastro_duplicado_por_cnpj():
    client = APIClient()
    client.post("/api/auth/cadastro/", payload_cadastro(), format="json")
    resp = client.post("/api/auth/cadastro/", payload_cadastro(), format="json")
    assert resp.status_code == 400
    assert "cnpj" in resp.data


def test_cadastro_exige_endereco_de_entrega():
    dados = payload_cadastro()
    dados["enderecos"][0]["tipo"] = "faturamento"
    resp = APIClient().post("/api/auth/cadastro/", dados, format="json")
    assert resp.status_code == 400


def test_login_e_perfil():
    APIClient().post("/api/auth/cadastro/", payload_cadastro(), format="json")
    client = APIClient()
    resp = client.post(
        "/api/auth/token/",
        {"email": "compras@farmaciaexemplo.com.br", "password": "senha-segura-123"},
        format="json",
    )
    assert resp.status_code == 200
    assert "access" in resp.data
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}")
    resp = client.get("/api/auth/eu/")
    assert resp.status_code == 200
    assert resp.data["status"] == "pendente"
    assert resp.data["pode_comprar"] is False


def test_perfil_exige_autenticacao():
    assert APIClient().get("/api/auth/eu/").status_code == 401
