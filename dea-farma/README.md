# DeA Farma — E-commerce B2B

Loja online da **DeA Farma**, distribuidora farmacêutica que vende para farmácias, drogarias e clínicas. Não é venda ao consumidor final: o cadastro passa por aprovação comercial antes da compra.

## Visão geral

| Camada | Tecnologia |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Django 5, Django REST Framework, JWT |
| Banco | PostgreSQL 16+ |
| Admin | Django Admin (aprovação de clientes, catálogo, pedidos) |

### O que a aplicação faz

- Vitrine de medicamentos com busca, categorias, filtros e promoções
- Cadastro B2B em etapas (empresa, contatos, endereços, senha)
- Login JWT e perfil com histórico de pedidos
- Carrinho local e checkout bloqueado até o cadastro ser **aprovado**
- Preço por unidade/caixa, faixas por volume, lotes (FEFO) e estoque
- Banners e promoções com vigência

## Estrutura do projeto

```
dea-farma/
├── docker-compose.yml          # PostgreSQL opcional via Docker
├── README.md
├── backend/
│   ├── dea_farma/              # Configuração Django (settings, URLs)
│   ├── clientes/               # Cadastro, login, perfil
│   ├── catalogo/               # Produtos, categorias, laboratórios, lotes
│   ├── pedidos/                # Pedidos e itens
│   ├── marketing/              # Banners e promoções
│   ├── .env.example
│   └── manage.py
└── frontend/                   # Loja (React)
```

## Modelo de dados (PostgreSQL)

O schema é criado pelas migrações Django. Principais tabelas:

**Catálogo**

- `catalogo_categoria` — categorias (auto-relacionamento para subcategorias)
- `catalogo_laboratorio`
- `catalogo_produto` — tipo (genérico/similar/referência), prescrição, preços
- `catalogo_faixapreco` — desconto progressivo por quantidade
- `catalogo_imagemproduto`
- `catalogo_loteestoque` — lote, validade e quantidade

**Clientes**

- `auth_user` (Django) + `clientes_cliente` (CNPJ, status pendente/aprovado/recusado/inativo)
- `clientes_endereco` — entrega ou faturamento
- `clientes_contato` — comprador, farmacêutico, CRF
- `clientes_documentocliente` — alvará, CRF, contrato social

**Pedidos**

- `pedidos_pedido` — número, status, forma de pagamento, totais
- `pedidos_itempedido` — preço congelado no momento da compra

**Marketing**

- `marketing_banner`
- `marketing_promocao` + tabelas M2M de produtos e categorias

## Como rodar

### Requisitos

- Python 3.11+
- Node.js 18+
- PostgreSQL 16+ **ou** Docker Desktop

Neste ambiente o banco já pode ser criado no PostgreSQL local:

- banco: `deafarma`
- usuário: `deafarma`
- senha: `deafarma`
- host: `localhost`
- porta: `5432`

### 1. Banco de dados

**Opção A — PostgreSQL já instalado (Windows)**

No `psql` como superusuário:

```sql
CREATE ROLE deafarma LOGIN PASSWORD 'deafarma';
CREATE DATABASE deafarma OWNER deafarma ENCODING 'UTF8';
GRANT ALL PRIVILEGES ON DATABASE deafarma TO deafarma;
\c deafarma
GRANT ALL ON SCHEMA public TO deafarma;
ALTER SCHEMA public OWNER TO deafarma;
```

**Opção B — Docker**

Na pasta `dea-farma`:

```bash
docker compose up -d
```

Sobe o PostgreSQL 16 na porta `5432` com as mesmas credenciais.

### 2. Backend (API)

```bash
cd dea-farma/backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env   # ou cp .env.example .env
```

Confira no `.env`:

```
POSTGRES_DB=deafarma
POSTGRES_USER=deafarma
POSTGRES_PASSWORD=deafarma
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
USE_SQLITE=0
```

Crie as tabelas, um superusuário e dados de demonstração:

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_demo
python manage.py runserver
```

A API fica em `http://localhost:8000/api/` e o admin em `http://localhost:8000/admin/`.

Conta de demonstração criada pelo `seed_demo`:

- e-mail: `farmacia.demo@deafarma.com.br`
- senha: `demo12345`
- status: **aprovado** (já pode finalizar pedido)

### 3. Frontend (loja)

Em outro terminal:

```bash
cd dea-farma/frontend
npm install
npm run dev
```

A loja abre em `http://localhost:5173`.

O arquivo `frontend/.env` aponta a API:

```
VITE_API_URL=http://localhost:8000/api
```

## API principal

| Método | Caminho | Quem usa |
| --- | --- | --- |
| POST | `/api/auth/cadastro/` | Cadastro público |
| POST | `/api/auth/token/` | Login (e-mail + senha) |
| POST | `/api/auth/token/refresh/` | Renovar JWT |
| GET | `/api/auth/eu/` | Perfil do cliente logado |
| GET | `/api/catalogo/produtos/` | Lista com filtros (`busca`, `categoria`, `laboratorio`, `tipo`, `prescricao`, `disponibilidade`, `promocao`, `preco_min`, `preco_max`, `ordering`) |
| GET | `/api/catalogo/produtos/{slug}/` | Detalhe |
| GET | `/api/catalogo/categorias/` | Categorias |
| GET | `/api/catalogo/laboratorios/` | Laboratórios |
| GET | `/api/marketing/banners/` | Banners vigentes |
| GET | `/api/marketing/promocoes/` | Promoções vigentes |
| GET/POST | `/api/pedidos/pedidos/` | Histórico e criação (JWT) |

### Regras de negócio importantes

- Cliente novo entra como `pendente`: navega no catálogo, mas **não fecha pedido**
- Só `aprovado` compra; recusado/inativo recebem mensagem clara
- A aprovação é feita no **Django Admin** (campo `status` do cliente)
- Itens do pedido congelam o preço vigente (faixa + promoção)
- Estoque baixa por lote mais próximo do vencimento (FEFO)

## Páginas da loja

- `/` — banners, categorias, ofertas e recém-chegados
- `/produtos` — catálogo com chips de categoria, busca e filtros
- `/produtos/:slug` — detalhe e adição à sacola
- `/promocoes` — itens com desconto ativo
- `/cadastro` e `/login`
- `/checkout` — endereço, pagamento e confirmação
- `/perfil` — dados da empresa e pedidos

A interface segue o padrão do iFood: busca sempre visível, categorias em círculos, cards com foto e botão “+”, sacola lateral, barra inferior no celular (Início, Busca, Ofertas, Pedidos).

## Testes

No backend, os testes usam SQLite isolado (`conftest.py` define `USE_SQLITE=1`):

```bash
cd dea-farma/backend
pytest
```

## Produção (checklist)

- Trocar `DJANGO_SECRET_KEY` e desligar `DJANGO_DEBUG`
- Definir `DJANGO_ALLOWED_HOSTS` e `CORS_ALLOWED_ORIGINS`
- Servir `static/` e `media/` (nginx ou similar)
- Não versionar o arquivo `.env`
