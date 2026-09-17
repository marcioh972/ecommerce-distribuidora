export type Endereco = {
  id: number;
  tipo: "entrega" | "faturamento";
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export type Contato = {
  id: number;
  funcao: "comprador" | "farmaceutico" | "outro";
  nome: string;
  email?: string;
  telefone: string;
  cpf?: string;
  registro_crf?: string;
};

export type ClientePerfil = {
  id: number;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  inscricao_estadual?: string;
  telefone: string;
  status: "pendente" | "aprovado" | "recusado" | "inativo";
  motivo_recusa?: string;
  email: string;
  pode_comprar: boolean;
  enderecos: Endereco[];
  contatos: Contato[];
  criado_em: string;
};

export type Laboratorio = { id: number; nome: string; slug: string };

export type Categoria = { id: number; nome: string; slug: string; icone?: string; subcategorias: string[] };

export type FaixaPreco = { quantidade_minima: number; preco_unidade: string; preco_caixa: string };

export type Produto = {
  id: number;
  nome: string;
  slug: string;
  principio_ativo: string;
  laboratorio: Laboratorio;
  tipo: "generico" | "similar" | "referencia";
  prescricao: "livre" | "com_prescricao" | "controlado";
  preco_unidade: string;
  preco_caixa: string;
  qtd_por_caixa: number;
  preco_promocional?: string | null;
  percentual_desconto?: number | null;
  em_estoque: boolean;
  imagem?: string | null;
  ean?: string;
  categoria?: Categoria;
  imagens?: { url: string; alt: string; ordem: number }[];
  faixas?: FaixaPreco[];
  estoque_minimo?: number;
  criado_em?: string;
};

export type Banner = {
  id: number;
  titulo: string;
  subtitulo?: string;
  imagem_url?: string;
  link?: string;
  cta?: string;
  ordem: number;
};

export type Promocao = {
  id: number;
  titulo: string;
  descricao?: string;
  tipo: "percentual" | "fixo";
  valor: string;
  percentual?: number | null;
  produtos: string[];
  fim: string;
};

export type ItemPedido = {
  id: number;
  produto_nome: string;
  produto_slug: string;
  quantidade: number;
  preco_unidade: string;
  preco_caixa: string;
  preco_efetivo: string;
  subtotal: string;
};

export type Pedido = {
  id: number;
  numero: number;
  cliente_nome: string;
  status: string;
  status_display: string;
  forma_pagamento: string;
  forma_pagamento_display: string;
  subtotal: string;
  desconto: string;
  total: string;
  observacoes?: string;
  itens: ItemPedido[];
  criado_em: string;
};

export type CartItem = {
  slug: string;
  nome: string;
  imagem?: string | null;
  preco_unidade: string;
  preco_caixa: string;
  qtd_por_caixa: number;
  preco_promocional?: string | null;
  quantidade: number;
};
