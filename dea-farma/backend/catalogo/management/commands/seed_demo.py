from datetime import timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.text import slugify

from catalogo.models import Categoria, FaixaPreco, Laboratorio, LoteEstoque, Produto
from clientes.models import Cliente, Contato, Endereco
from marketing.models import Banner, Promocao


class Command(BaseCommand):
    help = "Popula o PostgreSQL com catálogo, promoções e um cliente de demonstração."

    def handle(self, *args, **options):
        cats = self._categorias()
        labs = self._laboratorios()
        produtos = self._produtos(cats, labs)
        self._promocoes(produtos, cats)
        self._banners()
        self._cliente_demo()
        self.stdout.write(self.style.SUCCESS("Banco populado com dados de demonstração."))

    def _categorias(self):
        dados = [
            ("Analgésicos", "analgesicos", 1),
            ("Antibióticos", "antibioticos", 2),
            ("Dermocosméticos", "dermocosmeticos", 3),
            ("Vitaminas", "vitaminas", 4),
            ("Genéricos", "genericos", 5),
            ("Controlados", "controlados", 6),
        ]
        out = {}
        for nome, slug, ordem in dados:
            obj, _ = Categoria.objects.get_or_create(
                slug=slug,
                defaults={"nome": nome, "icone": slug, "ordem": ordem, "ativo": True},
            )
            out[slug] = obj
        return out

    def _laboratorios(self):
        nomes = ["EMS", "Eurofarma", "Medley", "Aché", "Neo Química", "La Roche-Posay"]
        out = {}
        for nome in nomes:
            obj, _ = Laboratorio.objects.get_or_create(slug=slugify(nome), defaults={"nome": nome})
            out[nome] = obj
        return out

    def _produtos(self, cats, labs):
        itens = [
            dict(
                nome="Dipirona 500 mg 10 comprimidos",
                principio="Dipirona sódica",
                cat="analgesicos",
                lab="EMS",
                tipo=Produto.Tipo.GENERICO,
                prescricao=Produto.Prescricao.LIVRE,
                ean="7896004700012",
                qtd=10,
                un=Decimal("2.90"),
                cx=Decimal("24.90"),
                faixa=(50, Decimal("2.40"), Decimal("21.00")),
            ),
            dict(
                nome="Paracetamol 750 mg 20 comprimidos",
                principio="Paracetamol",
                cat="analgesicos",
                lab="Medley",
                tipo=Produto.Tipo.GENERICO,
                prescricao=Produto.Prescricao.LIVRE,
                ean="7896422501123",
                qtd=20,
                un=Decimal("4.50"),
                cx=Decimal("78.00"),
                faixa=(40, Decimal("3.90"), Decimal("68.00")),
            ),
            dict(
                nome="Amoxicilina 500 mg 21 cápsulas",
                principio="Amoxicilina",
                cat="antibioticos",
                lab="Eurofarma",
                tipo=Produto.Tipo.GENERICO,
                prescricao=Produto.Prescricao.COM_PRESCRICAO,
                ean="7891317000456",
                qtd=21,
                un=Decimal("8.90"),
                cx=Decimal("165.00"),
                faixa=None,
            ),
            dict(
                nome="Azitromicina 500 mg 5 comprimidos",
                principio="Azitromicina",
                cat="antibioticos",
                lab="Aché",
                tipo=Produto.Tipo.REFERENCIA,
                prescricao=Produto.Prescricao.COM_PRESCRICAO,
                ean="7896094200881",
                qtd=5,
                un=Decimal("18.50"),
                cx=Decimal("82.00"),
                faixa=None,
            ),
            dict(
                nome="Effaclar Gel de Limpeza 300 ml",
                principio="Gel dermatológico",
                cat="dermocosmeticos",
                lab="La Roche-Posay",
                tipo=Produto.Tipo.REFERENCIA,
                prescricao=Produto.Prescricao.LIVRE,
                ean="3337872411991",
                qtd=1,
                un=Decimal("89.90"),
                cx=Decimal("89.90"),
                faixa=(12, Decimal("79.90"), Decimal("79.90")),
            ),
            dict(
                nome="Vitamina C 1 g 30 comprimidos efervescentes",
                principio="Ácido ascórbico",
                cat="vitaminas",
                lab="Neo Química",
                tipo=Produto.Tipo.SIMILAR,
                prescricao=Produto.Prescricao.LIVRE,
                ean="7896714203301",
                qtd=30,
                un=Decimal("12.90"),
                cx=Decimal("118.00"),
                faixa=None,
            ),
            dict(
                nome="Losartana 50 mg 30 comprimidos",
                principio="Losartana potássica",
                cat="genericos",
                lab="EMS",
                tipo=Produto.Tipo.GENERICO,
                prescricao=Produto.Prescricao.COM_PRESCRICAO,
                ean="7896004712345",
                qtd=30,
                un=Decimal("6.40"),
                cx=Decimal("165.00"),
                faixa=(60, Decimal("5.80"), Decimal("149.00")),
            ),
            dict(
                nome="Clonazepam 2 mg 30 comprimidos",
                principio="Clonazepam",
                cat="controlados",
                lab="Medley",
                tipo=Produto.Tipo.GENERICO,
                prescricao=Produto.Prescricao.CONTROLADO,
                ean="7896422509988",
                qtd=30,
                un=Decimal("9.80"),
                cx=Decimal("255.00"),
                faixa=None,
            ),
        ]
        produtos = []
        validade = timezone.localdate() + timedelta(days=540)
        for item in itens:
            slug = slugify(item["nome"])
            produto, created = Produto.objects.update_or_create(
                slug=slug,
                defaults={
                    "nome": item["nome"],
                    "principio_ativo": item["principio"],
                    "categoria": cats[item["cat"]],
                    "laboratorio": labs[item["lab"]],
                    "tipo": item["tipo"],
                    "prescricao": item["prescricao"],
                    "ean": item["ean"],
                    "qtd_por_caixa": item["qtd"],
                    "preco_unidade": item["un"],
                    "preco_caixa": item["cx"],
                    "estoque_minimo": 20,
                    "ativo": True,
                },
            )
            if item["faixa"]:
                qtd, un, cx = item["faixa"]
                FaixaPreco.objects.get_or_create(
                    produto=produto,
                    quantidade_minima=qtd,
                    defaults={"preco_unidade": un, "preco_caixa": cx},
                )
            LoteEstoque.objects.get_or_create(
                produto=produto,
                numero_lote=f"L{produto.id:04d}A",
                defaults={"quantidade": 400, "validade": validade},
            )
            produtos.append(produto)
        return produtos

    def _promocoes(self, produtos, cats):
        agora = timezone.now()
        promo, _ = Promocao.objects.update_or_create(
            titulo="Ofertas da semana",
            defaults={
                "descricao": "Desconto especial para reposição de estoque da farmácia.",
                "tipo": Promocao.TipoDesconto.PERCENTUAL,
                "valor": Decimal("12"),
                "inicio": agora - timedelta(days=1),
                "fim": agora + timedelta(days=14),
                "ativo": True,
            },
        )
        promo.produtos.set(produtos[:3])
        promo.categorias.set([cats["vitaminas"]])

    def _banners(self):
        agora = timezone.now()
        Banner.objects.update_or_create(
            titulo="Reposição inteligente para a sua farmácia",
            defaults={
                "subtitulo": "Genéricos, similares e referência com preço de distribuidora.",
                "link": "/produtos",
                "cta": "Ver catálogo",
                "ordem": 1,
                "ativo": True,
                "inicio": agora - timedelta(days=1),
                "fim": agora + timedelta(days=60),
            },
        )
        Banner.objects.update_or_create(
            titulo="Até 12% off nas ofertas da semana",
            defaults={
                "subtitulo": "Aproveite condições especiais para compra em volume.",
                "link": "/promocoes",
                "cta": "Ver ofertas",
                "ordem": 2,
                "ativo": True,
                "inicio": agora - timedelta(days=1),
                "fim": agora + timedelta(days=14),
            },
        )

    def _cliente_demo(self):
        user, created = User.objects.get_or_create(
            username="farmacia.demo@deafarma.com.br",
            defaults={
                "email": "farmacia.demo@deafarma.com.br",
                "first_name": "Farmácia",
                "last_name": "Demo",
            },
        )
        if created:
            user.set_password("demo12345")
            user.save()
        cliente, _ = Cliente.objects.update_or_create(
            cnpj="11222333000181",
            defaults={
                "user": user,
                "razao_social": "Farmácia Demo LTDA",
                "nome_fantasia": "Farmácia Demo",
                "inscricao_estadual": "172.16.1.3",
                "telefone": "(11) 4000-1234",
                "status": Cliente.Status.APROVADO,
            },
        )
        Endereco.objects.get_or_create(
            cliente=cliente,
            tipo=Endereco.Tipo.ENTREGA,
            cep="01310-100",
            defaults={
                "logradouro": "Avenida Paulista",
                "numero": "1000",
                "complemento": "Sala 12",
                "bairro": "Bela Vista",
                "cidade": "São Paulo",
                "uf": "SP",
            },
        )
        Contato.objects.get_or_create(
            cliente=cliente,
            funcao=Contato.Funcao.COMPRADOR,
            nome="Ana Compradora",
            defaults={"email": "compras@farmaciademo.com.br", "telefone": "(11) 98888-0001"},
        )
        self.stdout.write("Cliente demo: farmacia.demo@deafarma.com.br / demo12345 (aprovado)")
