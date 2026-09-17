import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { EmptyState, fmtMoney, Spinner } from "../components";
import { useAuth, useCart } from "../store";
import type { Endereco } from "../types";

export default function Checkout() {
  const { user, loading: authLoading } = useAuth();
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const [enderecoId, setEnderecoId] = useState<number | null>(null);
  const [forma, setForma] = useState("pix");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [numeroPedido, setNumeroPedido] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user && user.enderecos.length) setEnderecoId(user.enderecos[0].id);
  }, [user]);

  if (authLoading) return <Spinner className="py-20" />;
  if (!user) return null;

  const entregas = user.enderecos.filter((e) => e.tipo === "entrega");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!enderecoId) { setError("Selecione um endereço de entrega."); return; }
    if (items.length === 0) { setError("Seu carrinho está vazio."); return; }
    setLoading(true);
    try {
      const pedido = await api.criarPedido({
        forma_pagamento: forma,
        endereco_entrega: enderecoId,
        itens: items.map((i) => ({ produto: i.slug, quantidade: i.quantidade })),
      });
      setNumeroPedido(pedido.numero);
      setSuccess(true);
      clear();
    } catch (err: any) {
      const msg = err?.detail || err?.non_field_errors?.[0] || (typeof err === "object" ? Object.values(err).flat().join(" ") : "Erro ao finalizar pedido.");
      setError(msg);
    } finally { setLoading(false); }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-extrabold text-ink">Pedido recebido!</h1>
        <p className="text-sm text-gray-600 mt-2">Seu pedido <strong>#{numeroPedido}</strong> foi enviado com sucesso. Nossa equipe comercial entrará em contato para confirmar o pagamento.</p>
        <button onClick={() => navigate("/perfil")} className="inline-block mt-6 bg-ifood text-white font-black px-6 py-3 rounded-xl hover:bg-ifood-dark">Ver meus pedidos</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-extrabold text-ink mb-6">Finalizar compra</h1>
      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100 mb-4">{error}</div>}

      {user.status !== "aprovado" && (
        <div className="bg-amber-50 text-amber-800 text-sm px-4 py-3 rounded-lg border border-amber-200 mb-6">
          {user.status === "pendente" && "Seu cadastro ainda está em análise. Você pode revisar o carrinho, mas a compra só será liberada após aprovação."}
          {user.status === "recusado" && `Cadastro não aprovado. ${user.motivo_recusa ?? "Entre em contato com nosso time comercial."}`}
          {user.status === "inativo" && "Cadastro inativo. Entre em contato com nosso time comercial."}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState title="Carrinho vazio" subtitle="Adicione produtos antes de finalizar a compra." />
      ) : (
        <form onSubmit={submit} className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
            <h2 className="font-bold text-ink text-sm">Itens do carrinho</h2>
            {items.map((i) => (
              <div key={i.slug} className="flex justify-between text-sm">
                <span className="text-gray-600">{i.quantidade}x {i.nome}</span>
                <span className="font-semibold text-ink">{fmtMoney(parseFloat(i.preco_promocional ?? i.preco_unidade) * i.quantidade)}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-ink">
              <span>Total</span>
              <span>{fmtMoney(total)}</span>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
            <h2 className="font-bold text-ink text-sm">Endereço de entrega</h2>
            {entregas.length === 0 ? (
              <p className="text-sm text-red-600">Você não tem endereço de entrega cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {entregas.map((e) => (
                  <label key={e.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer ${enderecoId === e.id ? "border-ifood bg-ifood-light" : "border-gray-200"}`}>
                    <input type="radio" name="endereco" checked={enderecoId === e.id} onChange={() => setEnderecoId(e.id)} className="mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-ink">{e.logradouro}, {e.numero}{e.complemento ? ` — ${e.complemento}` : ""}</p>
                      <p className="text-gray-500">{e.bairro} — {e.cidade}/{e.uf} · CEP {e.cep}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
            <h2 className="font-bold text-ink text-sm">Forma de pagamento</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "pix", label: "PIX" },
                { value: "boleto", label: "Boleto bancário" },
                { value: "carteira", label: "Carnê / carteira" },
                { value: "deposito", label: "Depósito antecipado" },
              ].map((f) => (
                <label key={f.value} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer ${forma === f.value ? "border-ifood bg-ifood-light" : "border-gray-200"}`}>
                  <input type="radio" name="forma" value={f.value} checked={forma === f.value} onChange={() => setForma(f.value)} />
                  <span className="text-sm font-medium">{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading || entregas.length === 0} className="w-full bg-ifood text-white font-black py-3.5 rounded-xl hover:bg-ifood-dark disabled:opacity-50">
            {loading ? "Processando…" : "Confirmar pedido"}
          </button>
        </form>
      )}
    </div>
  );
}
