import type { Banner, Categoria, ClientePerfil, Laboratorio, Pedido, Produto, Promocao } from "./types";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

async function request<T>(path: string, opts: { method?: string; body?: unknown; auth?: boolean } = {}) {
  const { method = "GET", body, auth = true } = opts;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = localStorage.getItem("access");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && auth) {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    window.dispatchEvent(new Event("auth-change"));
  }
  const data = res.status !== 204 ? await res.json() : undefined;
  if (!res.ok) throw data;
  return data as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ access: string; refresh: string }>("/auth/token/", { method: "POST", body: { email, password }, auth: false }),
  refresh: (refresh: string) =>
    request<{ access: string }>("/auth/token/refresh/", { method: "POST", body: { refresh }, auth: false }),
  cadastro: (body: unknown) =>
    request<{ id: number; status: string; mensagem: string }>("/auth/cadastro/", { method: "POST", body, auth: false }),
  me: () => request<ClientePerfil>("/auth/eu/"),

  produtos: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<{ count: number; next: string | null; previous: string | null; results: Produto[] }>(`/catalogo/produtos/${qs}`, { auth: false });
  },
  produto: (slug: string) => request<Produto>(`/catalogo/produtos/${slug}/`, { auth: false }),
  categorias: () => request<Categoria[]>("/catalogo/categorias/", { auth: false }),
  laboratorios: () => request<Laboratorio[]>("/catalogo/laboratorios/", { auth: false }),

  banners: () => request<Banner[]>("/marketing/banners/", { auth: false }),
  promocoes: () => request<Promocao[]>("/marketing/promocoes/", { auth: false }),

  pedidos: () => request<{ count: number; next: string | null; previous: string | null; results: Pedido[] }>("/pedidos/pedidos/"),
  criarPedido: (body: unknown) => request<Pedido>("/pedidos/pedidos/", { method: "POST", body }),
};
