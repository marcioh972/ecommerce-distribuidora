import { useEffect, useState } from "react";
import { api } from "../api";
import { BannerCarousel, CategoryGrid, EmptyState, HorizontalRow, ProductCard, SectionTitle, Spinner } from "../components";
import type { Banner, Categoria, Produto } from "../types";

export default function Home() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [recentes, setRecentes] = useState<Produto[]>([]);
  const [ofertas, setOfertas] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [b, c, r, o] = await Promise.all([
          api.banners(),
          api.categorias(),
          api.produtos({ ordering: "-criado_em", page_size: "8" }),
          api.produtos({ promocao: "true", page_size: "8" }),
        ]);
        setBanners(b);
        setCategorias(c);
        setRecentes(r.results);
        setOfertas(o.results);
      } catch {
        setBanners([]);
        setCategorias([]);
        setRecentes([]);
        setOfertas([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Spinner className="py-20" />;

  return (
    <div className="space-y-8">
      <BannerCarousel banners={banners} />

      <section>
        <SectionTitle title="Categorias" linkTo="/produtos" />
        {categorias.length ? <CategoryGrid categorias={categorias} /> : <EmptyState title="Nenhuma categoria cadastrada" />}
      </section>

      <section>
        <SectionTitle title="Ofertas da semana" linkTo="/promocoes" />
        {ofertas.length ? (
          <HorizontalRow>
            {ofertas.map((p) => (
              <div key={p.id} className="w-[180px] md:w-[210px] shrink-0">
                <ProductCard produto={p} />
              </div>
            ))}
          </HorizontalRow>
        ) : (
          <EmptyState title="Nenhuma oferta ativa no momento" subtitle="Volte em breve!" />
        )}
      </section>

      <section>
        <SectionTitle title="Recém-chegados" linkTo="/produtos?ordering=-criado_em" />
        {recentes.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {recentes.map((p) => (
              <ProductCard key={p.id} produto={p} />
            ))}
          </div>
        ) : (
          <EmptyState title="Nenhum produto novo" />
        )}
      </section>

      <section className="grid grid-cols-3 gap-2 md:gap-4">
        {[
          { icon: "🚚", title: "Entrega rápida", text: "Para todo o Brasil" },
          { icon: "🏷️", title: "Preço de atacado", text: "Faixas por volume" },
          { icon: "🛡️", title: "Lotes rastreados", text: "Qualidade garantida" },
        ].map((d) => (
          <div key={d.title} className="bg-white rounded-ifood p-4 text-center shadow-card">
            <div className="text-2xl mb-1">{d.icon}</div>
            <h3 className="font-black text-ink text-sm">{d.title}</h3>
            <p className="text-[11px] text-gray-500 font-semibold mt-0.5">{d.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
