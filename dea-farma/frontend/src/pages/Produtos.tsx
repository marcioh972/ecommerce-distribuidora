import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import { EmptyState, ProductCard, SearchBar, Spinner } from "../components";
import type { Categoria, Laboratorio, Produto } from "../types";

export default function Produtos() {
  const [params, setParams] = useSearchParams();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const filters = useMemo(
    () => ({
      busca: params.get("busca") ?? "",
      categoria: params.get("categoria") ?? "",
      laboratorio: params.get("laboratorio") ?? "",
      tipo: params.get("tipo") ?? "",
      prescricao: params.get("prescricao") ?? "",
      disponibilidade: params.get("disponibilidade") ?? "",
      preco_min: params.get("preco_min") ?? "",
      preco_max: params.get("preco_max") ?? "",
      ordering: params.get("ordering") ?? "nome",
    }),
    [params],
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      const qs: Record<string, string> = { ordering: filters.ordering };
      if (filters.busca) qs.busca = filters.busca;
      if (filters.categoria) qs.categoria = filters.categoria;
      if (filters.laboratorio) qs.laboratorio = filters.laboratorio;
      if (filters.tipo) qs.tipo = filters.tipo;
      if (filters.prescricao) qs.prescricao = filters.prescricao;
      if (filters.disponibilidade) qs.disponibilidade = filters.disponibilidade;
      if (filters.preco_min) qs.preco_min = filters.preco_min;
      if (filters.preco_max) qs.preco_max = filters.preco_max;
      try {
        const data = await api.produtos(qs);
        setProdutos(data.results);
        setNextUrl(data.next);
      } catch {
        setProdutos([]);
        setNextUrl(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [filters]);

  useEffect(() => {
    api.categorias().then(setCategorias);
    api.laboratorios().then(setLaboratorios);
  }, []);

  const update = (key: string, value: string) => {
    const p = new URLSearchParams(params);
    if (value) p.set(key, value);
    else p.delete(key);
    setParams(p);
  };

  const loadMore = async () => {
    if (!nextUrl) return;
    setLoadingMore(true);
    const res = await fetch(nextUrl);
    const data = await res.json();
    setProdutos((prev) => [...prev, ...data.results]);
    setNextUrl(data.next);
    setLoadingMore(false);
  };

  return (
    <div>
      <div className="md:hidden mb-3">
        <SearchBar autoFocus={false} />
      </div>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3">
        {[{ slug: "", nome: "Tudo" }, ...categorias].map((c) => {
          const active = (c.slug || "") === filters.categoria;
          return (
            <button
              key={c.slug || "all"}
              onClick={() => update("categoria", c.slug)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-extrabold ${active ? "bg-ink text-white" : "bg-white text-ink shadow-card"}`}
            >
              {c.nome}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between mb-4 gap-3">
        <h1 className="text-lg font-black text-ink">
          {filters.busca ? `Resultados para “${filters.busca}”` : "Catálogo"}
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters((v) => !v)} className="text-sm font-extrabold text-ifood">
            Filtros
          </button>
          <select
            value={filters.ordering}
            onChange={(e) => update("ordering", e.target.value)}
            className="bg-white rounded-full px-3 py-2 text-xs font-bold shadow-card"
          >
            <option value="nome">Nome A–Z</option>
            <option value="-nome">Nome Z–A</option>
            <option value="preco_unidade">Menor preço</option>
            <option value="-preco_unidade">Maior preço</option>
            <option value="-criado_em">Mais recentes</option>
          </select>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-ifood p-4 shadow-card mb-4 grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          <Select label="Laboratório" value={filters.laboratorio} onChange={(v) => update("laboratorio", v)} options={laboratorios.map((l) => ({ label: l.nome, value: l.slug }))} />
          <Select label="Tipo" value={filters.tipo} onChange={(v) => update("tipo", v)} options={[{ label: "Genérico", value: "generico" }, { label: "Similar", value: "similar" }, { label: "Referência", value: "referencia" }]} />
          <Select label="Prescrição" value={filters.prescricao} onChange={(v) => update("prescricao", v)} options={[{ label: "Livre", value: "livre" }, { label: "Com prescrição", value: "com_prescricao" }, { label: "Controlado", value: "controlado" }]} />
          <Select label="Disponibilidade" value={filters.disponibilidade} onChange={(v) => update("disponibilidade", v)} options={[{ label: "Em estoque", value: "em_estoque" }, { label: "Sob encomenda", value: "sob_encomenda" }]} />
          <input type="number" placeholder="Preço mín." value={filters.preco_min} onChange={(e) => update("preco_min", e.target.value)} className="border rounded-xl px-3 py-2 text-sm" />
          <input type="number" placeholder="Preço máx." value={filters.preco_max} onChange={(e) => update("preco_max", e.target.value)} className="border rounded-xl px-3 py-2 text-sm" />
          <button onClick={() => setParams({ ordering: filters.ordering })} className="text-sm font-bold text-ifood">
            Limpar filtros
          </button>
        </div>
      )}

      {loading ? (
        <Spinner className="py-16" />
      ) : produtos.length === 0 ? (
        <EmptyState title="Nenhum produto encontrado" subtitle="Tente ajustar os filtros ou a busca." />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {produtos.map((p) => (
              <ProductCard key={p.id} produto={p} />
            ))}
          </div>
          {nextUrl && (
            <div className="mt-6 text-center">
              <button onClick={loadMore} disabled={loadingMore} className="bg-white text-sm font-black px-6 py-3 rounded-full shadow-card disabled:opacity-50">
                {loadingMore ? "Carregando…" : "Carregar mais"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) {
  return (
    <div>
      <label className="text-xs font-extrabold text-gray-500">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full border rounded-xl px-3 py-2 text-sm bg-white">
        <option value="">Todos</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
