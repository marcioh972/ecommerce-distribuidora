import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { EmptyState, fmtMoney, Spinner } from "../components";
import { useCart } from "../store";
import type { Produto } from "../types";

export default function ProdutoDetalhe() {
  const { slug } = useParams<{ slug: string }>();
  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const { add } = useCart();

  useEffect(() => {
    if (!slug) return;
    api.produto(slug).then((p) => {
      setProduto(p);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <Spinner className="py-20" />;
  if (!produto) return <EmptyState title="Produto não encontrado" />;

  const precoU = parseFloat(produto.preco_unidade);
  const precoC = parseFloat(produto.preco_caixa);
  const precoPromo = produto.preco_promocional ? parseFloat(produto.preco_promocional) : null;
  const precoShow = precoPromo ?? precoU;

  const handleAdd = () => {
    add({
      slug: produto.slug,
      nome: produto.nome,
      imagem: produto.imagem,
      preco_unidade: produto.preco_unidade,
      preco_caixa: produto.preco_caixa,
      qtd_por_caixa: produto.qtd_por_caixa,
      preco_promocional: produto.preco_promocional ?? null,
      quantidade: qty,
    });
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="rounded-ifood bg-white shadow-card flex items-center justify-center p-8 min-h-[280px]">
        {produto.imagens && produto.imagens.length ? (
          <img src={produto.imagens[0].url} alt={produto.nome} className="max-h-80 object-contain" />
        ) : produto.imagem ? (
          <img src={produto.imagem} alt={produto.nome} className="max-h-80 object-contain" />
        ) : (
          <span className="text-7xl opacity-40">💊</span>
        )}
      </div>
      <div className="space-y-4">
        <p className="text-xs font-black text-ifood uppercase tracking-wider">{produto.laboratorio.nome}</p>
        <h1 className="text-2xl md:text-3xl font-black text-ink">{produto.nome}</h1>
        <p className="text-sm text-gray-500 font-semibold">
          Princípio ativo: <span className="text-ink">{produto.principio_ativo}</span>
        </p>
        <div className="flex items-center gap-2 text-rating text-sm font-extrabold">
          ★ 4.8 <span className="text-gray-400 font-bold">· entrega 1–3 dias úteis</span>
        </div>

        {produto.prescricao !== "livre" && (
          <span className={`inline-block text-xs font-black px-3 py-1 rounded-full ${produto.prescricao === "controlado" ? "bg-ifood text-white" : "bg-amber-100 text-amber-800"}`}>
            {produto.prescricao === "controlado" ? "Medicamento controlado" : "Venda sob prescrição médica"}
          </span>
        )}

        <div className="flex items-baseline gap-3 pt-1">
          <span className="text-3xl font-black text-ink">{fmtMoney(precoShow)}</span>
          {precoPromo && <span className="text-lg text-gray-400 line-through">{fmtMoney(precoU)}</span>}
          {produto.percentual_desconto && <span className="text-sm font-black text-ifood">-{produto.percentual_desconto}%</span>}
        </div>
        <p className="text-sm text-gray-500 font-semibold">
          Caixa com {produto.qtd_por_caixa} unidades · {fmtMoney(precoC)}
        </p>

        {produto.faixas && produto.faixas.length > 0 && (
          <div className="bg-white rounded-ifood p-4 shadow-card">
            <h3 className="text-xs font-black text-gray-500 uppercase mb-2">Preços por quantidade</h3>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {produto.faixas.map((f) => (
                <div key={f.quantidade_minima} className="flex justify-between bg-mist rounded-xl px-3 py-2">
                  <span className="text-gray-600 font-semibold">A partir de {f.quantidade_minima} un</span>
                  <span className="font-black text-ink">{fmtMoney(parseFloat(f.preco_unidade))}/un</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2 sticky bottom-20 md:static">
          <div className="flex items-center bg-white rounded-full overflow-hidden shadow-card">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-4 py-3 text-lg font-black text-ifood">−</button>
            <span className="px-2 text-sm font-black w-8 text-center">{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} className="px-4 py-3 text-lg font-black text-ifood">+</button>
          </div>
          <button
            onClick={handleAdd}
            disabled={!produto.em_estoque}
            className="flex-1 bg-ifood text-white font-black py-3.5 rounded-xl hover:bg-ifood-dark disabled:opacity-50"
          >
            {produto.em_estoque ? `Adicionar · ${fmtMoney(precoShow * qty)}` : "Produto esgotado"}
          </button>
        </div>

        <div className="pt-2 text-xs text-gray-500 space-y-1 font-semibold">
          <p>EAN/GTIN: {produto.ean || "—"}</p>
          <p>
            Categoria:{" "}
            <Link to={`/produtos?categoria=${produto.categoria?.slug}`} className="text-ifood font-black">
              {produto.categoria?.nome}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
