import { useEffect, useState } from "react";
import { api } from "../api";
import { EmptyState, ProductCard, Spinner } from "../components";
import type { Produto } from "../types";

export default function Promocoes() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.produtos({ promocao: "true", page_size: "24" }).then((d) => { setProdutos(d.results); setLoading(false); });
  }, []);

  return (
    <div>
      <h1 className="text-xl font-black text-ink mb-4">Ofertas</h1>
      {loading ? <Spinner className="py-16" /> : produtos.length === 0 ? (
        <EmptyState title="Nenhuma promoção ativa" subtitle="Fique de olho, sempre tem novidade!" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {produtos.map((p) => <ProductCard key={p.id} produto={p} />)}
        </div>
      )}
    </div>
  );
}
