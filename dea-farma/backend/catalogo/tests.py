from datetime import timedelta

import pytest
from django.utils import timezone

from marketing.models import Banner, Promocao
from .models import Categoria, Laboratorio, LoteEstoque, Produto

pytestmark = pytest.mark.django_db


@pytest.fixture
def catalogo():
    cat = Categoria.objects.create(nome="Analgésicos", slug="analgésicos".replace("é", "e"))
    lab = Laboratorio.objects.create(nome="EMS", slug="ems")
    prod = Produto.objects.create(
        nome="Dipirona Sódica 500mg", slug="dipirona-500mg", principio_ativo="Dipirona Sódica",
        categoria=cat, laboratorio=lab, tipo="generico", preco_unidade="4.90", preco_caixa="49.00",
        qtd_por_caixa=10,
    )
    LoteEstoque.objects.create(produto=prod, numero_lote="A123", quantidade=100,
                               validade=timezone.localdate() + timedelta(days=365))
    return prod


def test_lista_produtos_publica(catalogo):
    from rest_framework.test import APIClient
    resp = APIClient().get("/api/catalogo/produtos/")
    assert resp.status_code == 200
    assert resp.data["count"] == 1
    item = resp.data["results"][0]
    assert item["em_estoque"] is True
    assert item["preco_unidade"] == "4.90"


def test_filtro_busca(catalogo):
    from rest_framework.test import APIClient
    client = APIClient()
    assert client.get("/api/catalogo/produtos/", {"busca": "dipirona"}).data["count"] == 1
    assert client.get("/api/catalogo/produtos/", {"busca": "ibuprofeno"}).data["count"] == 0
    assert client.get("/api/catalogo/produtos/", {"tipo": "generico"}).data["count"] == 1
    assert client.get("/api/catalogo/produtos/", {"tipo": "referencia"}).data["count"] == 0


def test_promocao_altera_preco_e_filtro(catalogo):
    from rest_framework.test import APIClient
    Promocao.objects.create(
        titulo="Semana do Genérico", tipo="percentual", valor="10",
        inicio=timezone.now() - timedelta(days=1), fim=timezone.now() + timedelta(days=7),
    ).produtos.add(catalogo)
    client = APIClient()
    item = client.get("/api/catalogo/produtos/").data["results"][0]
    assert str(item["preco_promocional"]) == "4.41"
    assert item["percentual_desconto"] == 10.0
    assert client.get("/api/catalogo/produtos/", {"promocao": "true"}).data["count"] == 1


def test_banners_vigentes(catalogo):
    from rest_framework.test import APIClient
    Banner.objects.create(titulo="Lançamento", ordem=1)
    resp = APIClient().get("/api/marketing/banners/")
    assert resp.status_code == 200
    assert len(resp.data) == 1
