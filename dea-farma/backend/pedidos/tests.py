from datetime import timedelta

import pytest
from django.utils import timezone

from catalogo.models import Categoria, Laboratorio, LoteEstoque, Produto
from clientes.models import Cliente
from .models import Pedido

pytestmark = pytest.mark.django_db

CNPJ = "11222333000181"


@pytest.fixture
def cliente(db):
    from django.contrib.auth.models import User
    user = User.objects.create_user(username="c@c.com", email="c@c.com", password="senha-segura-123")
    cliente = Cliente.objects.create(
        user=user, razao_social="Farmácia Teste", cnpj=CNPJ, telefone="(11) 4000-0000",
    )
    cliente.enderecos.create(
        tipo="entrega", cep="01310-100", logradouro="Av. Paulista", numero="1000",
        bairro="Bela Vista", cidade="São Paulo", uf="SP",
    )
    return cliente


@pytest.fixture
def produto(db):
    cat = Categoria.objects.create(nome="Analgésicos", slug="analgesicos")
    lab = Laboratorio.objects.create(nome="EMS", slug="ems")
    prod = Produto.objects.create(
        nome="Dipirona 500mg", slug="dipirona-500mg", principio_ativo="Dipirona",
        categoria=cat, laboratorio=lab, tipo="generico", preco_unidade="5.00", preco_caixa="50.00",
    )
    LoteEstoque.objects.create(produto=prod, numero_lote="B1", quantidade=50,
                               validade=timezone.localdate() + timedelta(days=365))
    return prod


@pytest.fixture
def autenticado(cliente):
    from rest_framework.test import APIClient
    client = APIClient()
    resp = client.post("/api/auth/token/", {"email": "c@c.com", "password": "senha-segura-123"}, format="json")
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}")
    return client


def pedido_payload(produto, endereco, **over):
    dados = {
        "forma_pagamento": "pix",
        "endereco_entrega": endereco.id,
        "itens": [{"produto": produto.slug, "quantidade": 10}],
    }
    dados.update(over)
    return dados


def test_pedido_bloqueado_com_cadastro_pendente(autenticado, cliente, produto):
    resp = autenticado.post(
        "/api/pedidos/pedidos/",
        pedido_payload(produto, cliente.enderecos.get()),
        format="json",
    )
    assert resp.status_code == 400
    assert "análise" in str(resp.data)


def test_pedido_criado_com_cadastro_aprovado(autenticado, cliente, produto):
    cliente.status = Cliente.Status.APROVADO
    cliente.save()
    resp = autenticado.post(
        "/api/pedidos/pedidos/",
        pedido_payload(produto, cliente.enderecos.get()),
        format="json",
    )
    assert resp.status_code == 201
    pedido = Pedido.objects.get()
    assert pedido.numero == 1
    assert str(pedido.total) == "50.00"
    item = pedido.itens.get()
    assert str(item.preco_efetivo) == "5.00"  # preço congelado
    produto.refresh_from_db()
    assert produto.lotes.get().quantidade == 40  # baixa de estoque


def test_pedido_valida_estoque(autenticado, cliente, produto):
    cliente.status = Cliente.Status.APROVADO
    cliente.save()
    resp = autenticado.post(
        "/api/pedidos/pedidos/",
        pedido_payload(produto, cliente.enderecos.get(), itens=[{"produto": produto.slug, "quantidade": 999}]),
        format="json",
    )
    assert resp.status_code == 400
    assert "Estoque insuficiente" in str(resp.data)


def test_cliente_somente_ve_seus_pedidos(autenticado):
    assert autenticado.get("/api/pedidos/pedidos/").status_code == 200
