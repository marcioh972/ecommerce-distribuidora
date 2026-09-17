import { useEffect, useState } from "react";
import { api } from "../api";
import { EmptyState, fmtMoney, Spinner, StatusBanner } from "../components";
import { useAuth } from "../store";
import type { Pedido } from "../types";

export default function Perfil() {
  const { user, loading: authLoading } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.pedidos().then((d) => { setPedidos(d.results); setLoading(false); });
  }, [user]);

  if (authLoading) return <Spinner className="py-20" />;
  if (!user) return <EmptyState title="Faça login para ver seu perfil" />;

  const statusColor: Record<string, string> = {
    recebido: "bg-blue-50 text-blue-700 border-blue-200",
    em_separacao: "bg-amber-50 text-amber-700 border-amber-200",
    faturado: "bg-purple-50 text-purple-700 border-purple-200",
    enviado: "bg-sky-50 text-sky-700 border-sky-200",
    entregue: "bg-green-50 text-green-700 border-green-200",
    cancelado: "bg-gray-100 text-gray-600 border-gray-200",
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <StatusBanner />

      <section className="bg-white border border-gray-100 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-ink mb-4">Dados da empresa</h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Razão social</span><p className="font-medium text-ink">{user.razao_social}</p></div>
          <div><span className="text-gray-500">Nome fantasia</span><p className="font-medium text-ink">{user.nome_fantasia || "—"}</p></div>
          <div><span className="text-gray-500">CNPJ</span><p className="font-medium text-ink">{user.cnpj}</p></div>
          <div><span className="text-gray-500">Inscrição estadual</span><p className="font-medium text-ink">{user.inscricao_estadual || "—"}</p></div>
          <div><span className="text-gray-500">Telefone</span><p className="font-medium text-ink">{user.telefone}</p></div>
          <div><span className="text-gray-500">E-mail</span><p className="font-medium text-ink">{user.email}</p></div>
        </div>
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border capitalize"
          style={{
            background: user.status === "aprovado" ? "#E8F5EE" : user.status === "pendente" ? "#FEF9C3" : user.status === "recusado" ? "#FEE2E2" : "#F3F4F6",
            color: user.status === "aprovado" ? "#08502B" : user.status === "pendente" ? "#854D0E" : user.status === "recusado" ? "#991B1B" : "#374151",
            borderColor: user.status === "aprovado" ? "#A7F3D0" : user.status === "pendente" ? "#FDE68A" : user.status === "recusado" ? "#FECACA" : "#E5E7EB",
          }}
        >
          {user.status === "aprovado" ? "✓ Aprovado" : user.status === "pendente" ? "⏳ Pendente" : user.status === "recusado" ? "✕ Recusado" : "⏸ Inativo"}
        </div>
      </section>

      <section className="bg-white border border-gray-100 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-ink mb-4">Endereços</h2>
        {user.enderecos.length === 0 ? <p className="text-sm text-gray-500">Nenhum endereço cadastrado.</p> : (
          <div className="space-y-3">
            {user.enderecos.map((e) => (
              <div key={e.id} className="text-sm border border-gray-100 rounded-lg p-3">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${e.tipo === "entrega" ? "bg-ifood-light text-ifood" : "bg-gray-100 text-gray-600"}`}>{e.tipo}</span>
                <p className="mt-1 font-medium text-ink">{e.logradouro}, {e.numero}{e.complemento ? ` — ${e.complemento}` : ""}</p>
                <p className="text-gray-500">{e.bairro} — {e.cidade}/{e.uf} · CEP {e.cep}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white border border-gray-100 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-ink mb-4">Meus pedidos</h2>
        {loading ? <Spinner className="py-10" /> : pedidos.length === 0 ? (
          <EmptyState title="Nenhum pedido ainda" subtitle="Seu histórico de compras aparecerá aqui." />
        ) : (
          <div className="space-y-4">
            {pedidos.map((p) => (
              <div key={p.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs text-gray-400">Pedido #{p.numero}</span>
                    <p className="text-sm font-bold text-ink">{p.status_display}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusColor[p.status] || "bg-gray-50 text-gray-600 border-gray-200"}`}>{p.status_display}</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  {p.itens.map((i) => (
                    <div key={i.id} className="flex justify-between">
                      <span>{i.quantidade}x {i.produto_nome}</span>
                      <span className="font-medium text-ink">{fmtMoney(parseFloat(i.subtotal))}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 mt-2 pt-2 flex justify-between text-sm font-bold text-ink">
                  <span>Total</span>
                  <span>{fmtMoney(parseFloat(p.total))}</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">{new Date(p.criado_em).toLocaleDateString("pt-BR")} · {p.forma_pagamento_display}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
