import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth, useCart } from "./store";
import type { Produto } from "./types";

export function fmtMoney(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="w-8 h-8 border-2 border-ifood border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center py-16">
      <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-ifood-light flex items-center justify-center text-2xl">📦</div>
      <h3 className="text-lg font-extrabold text-ink">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

export function SectionTitle({ title, linkTo, linkLabel }: { title: string; linkTo?: string; linkLabel?: string }) {
  return (
    <div className="flex items-end justify-between mb-3 px-1">
      <h2 className="text-lg md:text-xl font-extrabold text-ink">{title}</h2>
      {linkTo && (
        <Link to={linkTo} className="text-sm font-bold text-ifood hover:underline">
          {linkLabel ?? "Ver mais"}
        </Link>
      )}
    </div>
  );
}

export function StatusBanner() {
  const { user } = useAuth();
  if (!user || user.status === "aprovado") return null;
  const map: Record<string, { cls: string; text: string }> = {
    pendente: { cls: "bg-amber-50 text-amber-900 border-amber-200", text: "Cadastro em análise. Você pode navegar, mas a compra libera após aprovação." },
    recusado: { cls: "bg-red-50 text-red-800 border-red-200", text: `Cadastro não aprovado. ${user.motivo_recusa ?? "Fale com o comercial."}` },
    inativo: { cls: "bg-gray-100 text-gray-700 border-gray-200", text: "Cadastro inativo. Fale com o comercial." },
  };
  const s = map[user.status];
  if (!s) return null;
  return <div className={`border px-4 py-3 rounded-ifood text-sm font-bold ${s.cls}`}>{s.text}</div>;
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" strokeLinecap="round" />
    </svg>
  );
}

export function SearchBar({ compact = false, autoFocus = false }: { compact?: boolean; autoFocus?: boolean }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate(`/produtos?busca=${encodeURIComponent(q.trim())}`);
  };
  return (
    <form onSubmit={onSubmit} className={`relative ${compact ? "w-full" : "w-full"}`}>
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
        <IconSearch />
      </span>
      <input
        value={q}
        autoFocus={autoFocus}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Busque por medicamento, princípio ativo ou laboratório"
        className="w-full rounded-xl border-0 bg-mist pl-11 pr-4 py-3 text-sm font-semibold placeholder:font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-ifood/30"
      />
    </form>
  );
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 shrink-0">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-ifood text-white font-black text-sm">DeA</span>
      <span className="hidden sm:block font-black text-ifood text-xl tracking-tight">Farma</span>
    </Link>
  );
}

export function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [openMenu, setOpenMenu] = useState(false);
  const [openCart, setOpenCart] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const endereco = user?.enderecos.find((e) => e.tipo === "entrega");

  return (
    <>
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 md:gap-6">
          <Logo />
          <button
            type="button"
            onClick={() => navigate(user ? "/perfil" : "/login")}
            className="hidden md:flex flex-col items-start min-w-[140px] text-left"
          >
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Entregar em</span>
            <span className="text-sm font-extrabold text-ink truncate max-w-[220px]">
              {endereco ? `${endereco.logradouro}, ${endereco.numero}` : "Selecione o endereço"} ▾
            </span>
          </button>
          <div className="hidden md:block flex-1">
            <SearchBar compact />
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => setOpenCart(true)}
              className="relative p-2.5 rounded-full hover:bg-mist transition"
              aria-label="Carrinho"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-ink" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 6h15l-1.5 9h-12L5 3H2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="20" r="1.4" fill="currentColor" />
                <circle cx="18" cy="20" r="1.4" fill="currentColor" />
              </svg>
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-ifood text-white text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
            {user ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setOpenMenu((v) => !v)}
                  className="flex items-center gap-2 text-sm font-extrabold text-ink hover:bg-mist px-3 py-2 rounded-full"
                >
                  {user.nome_fantasia || user.razao_social}
                </button>
                {openMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-ifood shadow-lift border border-gray-100 overflow-hidden">
                    <Link to="/perfil" onClick={() => setOpenMenu(false)} className="block px-4 py-2.5 text-sm font-semibold text-ink hover:bg-mist">
                      Pedidos e perfil
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setOpenMenu(false);
                        navigate("/");
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-ifood hover:bg-ifood-light"
                    >
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="hidden md:inline-flex text-sm font-extrabold text-ifood px-3 py-2">
                Entrar
              </Link>
            )}
          </div>
        </div>
        {location.pathname !== "/produtos" && (
          <div className="md:hidden px-4 pb-3">
            <SearchBar />
          </div>
        )}
      </header>
      {openCart && <CartDrawer onClose={() => setOpenCart(false)} />}
    </>
  );
}

export function BottomNav() {
  const { count } = useCart();
  const item = "flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold";
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-4 h-16">
        <NavLink to="/" end className={({ isActive }) => `${item} ${isActive ? "text-ifood" : "text-gray-400"}`}>
          <span className="text-lg">🏠</span>
          Início
        </NavLink>
        <NavLink to="/produtos" className={({ isActive }) => `${item} ${isActive ? "text-ifood" : "text-gray-400"}`}>
          <span className="text-lg">🔍</span>
          Busca
        </NavLink>
        <NavLink to="/promocoes" className={({ isActive }) => `${item} relative ${isActive ? "text-ifood" : "text-gray-400"}`}>
          <span className="text-lg">🏷️</span>
          Ofertas
          {count > 0 && <span className="sr-only">{count} no carrinho</span>}
        </NavLink>
        <NavLink to="/perfil" className={({ isActive }) => `${item} ${isActive ? "text-ifood" : "text-gray-400"}`}>
          <span className="text-lg">👤</span>
          Pedidos
        </NavLink>
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="hidden md:block bg-[#1A1A1A] text-white/70 text-sm mt-8">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <p className="font-black text-white text-lg mb-3">DeA Farma</p>
          <p className="leading-relaxed">Distribuidora farmacêutica B2B para farmácias, drogarias e clínicas em todo o Brasil.</p>
        </div>
        <div>
          <h4 className="text-white font-extrabold mb-3">Atendimento</h4>
          <ul className="space-y-2 font-semibold">
            <li>(11) 4000-0000</li>
            <li>comercial@deafarma.com.br</li>
            <li>Seg–Sex: 8h–18h</li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-extrabold mb-3">Links</h4>
          <ul className="space-y-2 font-semibold">
            <li><Link to="/produtos" className="text-white/70 hover:text-white">Catálogo</Link></li>
            <li><Link to="/promocoes" className="text-white/70 hover:text-white">Promoções</Link></li>
            <li><Link to="/cadastro" className="text-white/70 hover:text-white">Cadastro</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-extrabold mb-3">Endereço</h4>
          <p className="font-semibold">Av. Paulista, 1000 — Bela Vista<br />São Paulo/SP — CEP 01310-100</p>
        </div>
      </div>
      <div className="border-t border-white/10 text-center py-4 text-xs text-white/40">
        © {new Date().getFullYear()} DeA Farma. Todos os direitos reservados.
      </div>
    </footer>
  );
}

export function ProductCard({ produto }: { produto: Produto }) {
  const { add } = useCart();
  const preco = parseFloat(produto.preco_unidade);
  const precoPromo = produto.preco_promocional ? parseFloat(produto.preco_promocional) : null;
  const precoShow = precoPromo ?? preco;
  const pct = produto.percentual_desconto;
  return (
    <article className="bg-white rounded-ifood overflow-hidden shadow-card hover:shadow-lift transition flex flex-col min-w-[160px]">
      <Link to={`/produtos/${produto.slug}`} className="block relative">
        <div className="aspect-[16/10] bg-mist flex items-center justify-center">
          {produto.imagem ? (
            <img src={produto.imagem} alt={produto.nome} className="w-full h-full object-contain p-3" />
          ) : (
            <span className="text-4xl opacity-40">💊</span>
          )}
        </div>
        {pct ? (
          <span className="absolute top-2 left-2 bg-ifood text-white text-[11px] font-black px-2 py-0.5 rounded-md">
            {pct}% OFF
          </span>
        ) : null}
      </Link>
      <div className="p-3 flex-1 flex flex-col">
        <Link to={`/produtos/${produto.slug}`} className="text-sm font-extrabold text-ink leading-snug line-clamp-2 hover:text-ifood">
          {produto.nome}
        </Link>
        <p className="text-xs text-gray-400 font-semibold mt-0.5 truncate">{produto.laboratorio.nome} · {produto.principio_ativo}</p>
        <div className="flex items-center gap-1 mt-1.5 text-rating text-xs font-extrabold">
          <span>★ 4.8</span>
          <span className="text-gray-300">·</span>
          <span className="text-gray-500 font-bold">entrega 1–3 dias</span>
        </div>
        <div className="mt-auto pt-2 flex items-end justify-between gap-2">
          <div>
            {precoPromo && <p className="text-[11px] text-gray-400 line-through font-semibold">{fmtMoney(preco)}</p>}
            <p className="text-base font-black text-ink">{fmtMoney(precoShow)}</p>
            <p className="text-[11px] text-gray-400 font-bold">cx {produto.qtd_por_caixa} un</p>
          </div>
          <button
            onClick={() =>
              add({
                slug: produto.slug,
                nome: produto.nome,
                imagem: produto.imagem,
                preco_unidade: produto.preco_unidade,
                preco_caixa: produto.preco_caixa,
                qtd_por_caixa: produto.qtd_por_caixa,
                preco_promocional: produto.preco_promocional ?? null,
                quantidade: 1,
              })
            }
            disabled={!produto.em_estoque}
            className="shrink-0 w-9 h-9 rounded-full bg-ifood text-white text-xl font-black leading-none hover:bg-ifood-dark disabled:opacity-40"
            aria-label="Adicionar"
          >
            {produto.em_estoque ? "+" : "×"}
          </button>
        </div>
      </div>
    </article>
  );
}

export function BannerCarousel({ banners }: { banners: { id: number; imagem_url?: string; titulo: string; subtitulo?: string; link?: string; cta?: string }[] }) {
  const [idx, setIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (banners.length <= 1) return;
    timer.current = setInterval(() => setIdx((i) => (i + 1) % banners.length), 5000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [banners.length]);
  if (!banners.length) {
    return (
      <div className="rounded-ifood overflow-hidden bg-gradient-to-r from-ifood to-[#FF7A3D] text-white px-6 py-8 md:py-12">
        <p className="text-xs font-black uppercase tracking-widest opacity-80">DeA Farma</p>
        <h2 className="text-2xl md:text-4xl font-black leading-tight mt-1">Peça para a sua farmácia com preço de distribuidora</h2>
        <Link to="/produtos" className="inline-block mt-4 bg-white text-ifood text-sm font-black px-5 py-2.5 rounded-full">
          Ver catálogo
        </Link>
      </div>
    );
  }
  const b = banners[idx];
  return (
    <div className="relative rounded-ifood overflow-hidden">
      <div className="aspect-[21/9] md:aspect-[3/1] bg-gradient-to-r from-ifood to-[#FF7A3D] flex items-center relative min-h-[140px]">
        {b.imagem_url ? <img src={b.imagem_url} alt={b.titulo} className="absolute inset-0 w-full h-full object-cover" /> : null}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
        <div className="relative z-10 px-5 md:px-10 max-w-xl text-white">
          <h2 className="text-xl md:text-4xl font-black leading-tight">{b.titulo}</h2>
          {b.subtitulo && <p className="mt-1 text-sm md:text-base font-semibold opacity-90">{b.subtitulo}</p>}
          {b.link && (
            <Link to={b.link} className="inline-block mt-4 bg-white text-ifood text-sm font-black px-5 py-2.5 rounded-full">
              {b.cta || "Pedir agora"}
            </Link>
          )}
        </div>
      </div>
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} className={`h-1.5 rounded-full transition ${i === idx ? "w-5 bg-white" : "w-1.5 bg-white/50"}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryGrid({ categorias }: { categorias: { id: number; nome: string; slug: string; icone?: string }[] }) {
  const iconMap: Record<string, { emoji: string; bg: string }> = {
    analgesicos: { emoji: "💊", bg: "bg-[#FFE8E0]" },
    antibioticos: { emoji: "🧪", bg: "bg-[#E4F4EC]" },
    dermocosmeticos: { emoji: "🧴", bg: "bg-[#FFF3C4]" },
    vitaminas: { emoji: "🍊", bg: "bg-[#FFE1C6]" },
    genericos: { emoji: "💚", bg: "bg-[#DDF4E4]" },
    controlados: { emoji: "🔒", bg: "bg-[#E8E8F8]" },
  };
  return (
    <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-1 -mx-1 px-1">
      {categorias.map((c) => {
        const style = iconMap[c.icone ?? ""] ?? iconMap[c.slug] ?? { emoji: "📦", bg: "bg-mist" };
        return (
          <Link key={c.id} to={`/produtos?categoria=${c.slug}`} className="flex flex-col items-center gap-2 min-w-[76px]">
            <span className={`w-16 h-16 rounded-full ${style.bg} flex items-center justify-center text-2xl shadow-card`}>{style.emoji}</span>
            <span className="text-[11px] font-extrabold text-ink text-center leading-tight">{c.nome}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function HorizontalRow({ children }: { children: ReactNode }) {
  return <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 -mx-1 px-1">{children}</div>;
}

export function CartDrawer({ onClose }: { onClose: () => void }) {
  const { items, updateQty, remove, total, clear } = useCart();
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-black text-ink text-lg">Sacola</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-ink text-xl font-bold">✕</button>
        </div>
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <p className="text-4xl mb-3">🛍️</p>
            <p className="font-extrabold text-ink">Sua sacola está vazia</p>
            <p className="text-sm text-gray-500 mt-1">Adicione produtos para montar o pedido.</p>
            <button onClick={onClose} className="mt-5 bg-ifood text-white font-black px-6 py-3 rounded-full">
              Ver catálogo
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {items.map((i) => (
                <div key={i.slug} className="flex gap-3">
                  <div className="w-16 h-16 rounded-ifood bg-mist flex items-center justify-center shrink-0 overflow-hidden">
                    {i.imagem ? <img src={i.imagem} alt="" className="w-full h-full object-contain p-1" /> : <span className="text-xl">💊</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-ink truncate">{i.nome}</p>
                    <p className="text-xs text-gray-500 font-semibold">{fmtMoney(parseFloat(i.preco_promocional ?? i.preco_unidade))}/un</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => updateQty(i.slug, i.quantidade - 1)} className="w-7 h-7 rounded-full border border-ifood text-ifood font-black">−</button>
                      <span className="text-sm font-black w-6 text-center">{i.quantidade}</span>
                      <button onClick={() => updateQty(i.slug, i.quantidade + 1)} className="w-7 h-7 rounded-full bg-ifood text-white font-black">+</button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-ink">{fmtMoney(parseFloat(i.preco_promocional ?? i.preco_unidade) * i.quantidade)}</p>
                    <button onClick={() => remove(i.slug)} className="text-xs font-bold text-ifood mt-1">Remover</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 px-5 py-4 space-y-3 pb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-bold">Subtotal</span>
                <span className="font-black text-ink">{fmtMoney(total)}</span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  navigate("/checkout");
                }}
                className="w-full bg-ifood text-white font-black py-3.5 rounded-xl hover:bg-ifood-dark"
              >
                Fazer pedido · {fmtMoney(total)}
              </button>
              <button onClick={clear} className="w-full text-xs font-bold text-gray-400">Esvaziar sacola</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
