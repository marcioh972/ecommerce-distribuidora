import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

function apenasDigitos(v: string) { return v.replace(/\D/g, ""); }

function mascaraCNPJ(v: string) {
  const d = apenasDigitos(v).slice(0, 14);
  return d.replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
}

function mascaraTelefone(v: string) {
  const d = apenasDigitos(v).slice(0, 11);
  if (d.length > 10) return d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  return d.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
}

function mascaraCEP(v: string) {
  const d = apenasDigitos(v).slice(0, 8);
  return d.replace(/(\d{5})(\d)/, "$1-$2");
}

function validarCNPJ(cnpj: string): boolean {
  const d = apenasDigitos(cnpj);
  if (d.length !== 14 || new Set(d).size === 1) return false;
  const calc = (pos: number) => {
    let s = 0, p = pos === 12 ? [5,4,3,2,9,8,7,6,5,4,3,2] : [6,5,4,3,2,9,8,7,6,5,4,3,2];
    for (let i = 0; i < pos; i++) s += parseInt(d[i]) * p[i];
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === parseInt(d[12]) && calc(13) === parseInt(d[13]);
}

type EnderecoForm = { tipo: "entrega" | "faturamento"; cep: string; logradouro: string; numero: string; complemento: string; bairro: string; cidade: string; uf: string };
type ContatoForm = { funcao: "comprador" | "farmaceutico" | "outro"; nome: string; email: string; telefone: string; cpf: string; registro_crf: string };

export default function Cadastro() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [doneMsg, setDoneMsg] = useState("");

  const [empresa, setEmpresa] = useState({ razao_social: "", nome_fantasia: "", cnpj: "", inscricao_estadual: "", telefone: "" });
  const [contatos, setContatos] = useState<ContatoForm[]>([{ funcao: "comprador", nome: "", email: "", telefone: "", cpf: "", registro_crf: "" }]);
  const [enderecos, setEnderecos] = useState<EnderecoForm[]>([{ tipo: "entrega", cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "" }]);
  const [acesso, setAcesso] = useState({ email: "", senha: "", senha_confirmacao: "" });

  const steps = ["Empresa", "Contatos", "Endereços", "Acesso"];

  const validateStep = (): string => {
    if (step === 1) {
      if (!empresa.razao_social.trim()) return "Informe a razão social.";
      if (!validarCNPJ(empresa.cnpj)) return "CNPJ inválido.";
      if (apenasDigitos(empresa.telefone).length < 10) return "Telefone inválido.";
    }
    if (step === 2) {
      for (const c of contatos) {
        if (!c.nome.trim()) return "Preencha o nome de todos os contatos.";
        if (apenasDigitos(c.telefone).length < 10) return `Telefone inválido para ${c.nome || "contato"}.`;
      }
    }
    if (step === 3) {
      let temEntrega = false;
      for (const e of enderecos) {
        if (!e.logradouro.trim() || !e.numero.trim() || !e.bairro.trim() || !e.cidade.trim() || !e.uf.trim()) return "Preencha todos os campos dos endereços.";
        if (e.tipo === "entrega") temEntrega = true;
      }
      if (!temEntrega) return "Informe ao menos um endereço de entrega.";
    }
    if (step === 4) {
      if (!acesso.email.trim()) return "Informe o e-mail.";
      if (acesso.senha.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
      if (acesso.senha !== acesso.senha_confirmacao) return "As senhas não coincidem.";
    }
    return "";
  };

  const next = () => { const err = validateStep(); if (err) { setError(err); return; } setError(""); setStep((s) => Math.min(4, s + 1)); };
  const prev = () => { setError(""); setStep((s) => Math.max(1, s - 1)); };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const err = validateStep();
    if (err) { setError(err); return; }
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...empresa,
        cnpj: apenasDigitos(empresa.cnpj),
        telefone: empresa.telefone,
        email: acesso.email,
        senha: acesso.senha,
        senha_confirmacao: acesso.senha_confirmacao,
        enderecos: enderecos.map((e) => ({ ...e, cep: mascaraCEP(e.cep) })),
        contatos: contatos.map((c) => ({ ...c, telefone: c.telefone })),
      };
      const res = await api.cadastro(payload);
      setDone(true);
      setDoneMsg(res.mensagem);
    } catch (err: any) {
      const msgs: string[] = [];
      if (typeof err === "object" && err !== null) {
        Object.entries(err).forEach(([k, v]) => {
          if (Array.isArray(v)) msgs.push(`${k}: ${v.join(", ")}`);
          else if (typeof v === "string") msgs.push(`${k}: ${v}`);
        });
      }
      setError(msgs.length ? msgs.join(" | ") : "Erro ao enviar cadastro. Tente novamente.");
    } finally { setLoading(false); }
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-extrabold text-ink">Cadastro enviado!</h1>
        <p className="text-sm text-gray-600 mt-2">{doneMsg}</p>
        <Link to="/login" className="inline-block mt-6 bg-ifood text-white font-black px-6 py-3 rounded-xl hover:bg-ifood-dark">Fazer login</Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="text-center mb-6 flex flex-col items-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-ifood text-white font-black mb-3">DeA</span>
        <h1 className="text-2xl font-extrabold text-ink">Criar conta</h1>
        <p className="text-sm text-gray-500 mt-1">Preencha os dados da sua farmácia ou clínica.</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-col items-center gap-1 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i + 1 === step ? "bg-ifood text-white" : i + 1 < step ? "bg-ifood-light text-ifood" : "bg-gray-100 text-gray-400"}`}>
              {i + 1 < step ? "✓" : i + 1}
            </div>
            <span className={`text-[10px] font-semibold ${i + 1 === step ? "text-ink" : "text-gray-400"}`}>{s}</span>
          </div>
        ))}
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100 mb-4">{error}</div>}

      <form onSubmit={submit} className="space-y-4">
        {step === 1 && (
          <>
            <Field label="Razão social *" value={empresa.razao_social} onChange={(v) => setEmpresa((p) => ({ ...p, razao_social: v }))} />
            <Field label="Nome fantasia" value={empresa.nome_fantasia} onChange={(v) => setEmpresa((p) => ({ ...p, nome_fantasia: v }))} />
            <Field label="CNPJ *" value={empresa.cnpj} onChange={(v) => setEmpresa((p) => ({ ...p, cnpj: mascaraCNPJ(v) }))} maxLength={18} />
            <Field label="Inscrição estadual" value={empresa.inscricao_estadual} onChange={(v) => setEmpresa((p) => ({ ...p, inscricao_estadual: v }))} />
            <Field label="Telefone *" value={empresa.telefone} onChange={(v) => setEmpresa((p) => ({ ...p, telefone: mascaraTelefone(v) }))} maxLength={15} />
          </>
        )}

        {step === 2 && (
          <div className="space-y-6">
            {contatos.map((c, idx) => (
              <div key={idx} className="bg-mist rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase">Contato {idx + 1}</span>
                  {contatos.length > 1 && <button type="button" onClick={() => setContatos((prev) => prev.filter((_, i) => i !== idx))} className="text-xs text-red-500 hover:underline">Remover</button>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <SelectField label="Função *" value={c.funcao} onChange={(v) => setContatos((prev) => prev.map((x, i) => i === idx ? { ...x, funcao: v as any } : x))} options={[{ label: "Comprador", value: "comprador" }, { label: "Farmacêutico responsável", value: "farmaceutico" }, { label: "Outro", value: "outro" }]} />
                  <Field label="Nome *" value={c.nome} onChange={(v) => setContatos((prev) => prev.map((x, i) => i === idx ? { ...x, nome: v } : x))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Telefone *" value={c.telefone} onChange={(v) => setContatos((prev) => prev.map((x, i) => i === idx ? { ...x, telefone: mascaraTelefone(v) } : x))} maxLength={15} />
                  <Field label="E-mail" type="email" value={c.email} onChange={(v) => setContatos((prev) => prev.map((x, i) => i === idx ? { ...x, email: v } : x))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="CPF" value={c.cpf} onChange={(v) => setContatos((prev) => prev.map((x, i) => i === idx ? { ...x, cpf: v } : x))} />
                  <Field label="CRF" value={c.registro_crf} onChange={(v) => setContatos((prev) => prev.map((x, i) => i === idx ? { ...x, registro_crf: v } : x))} />
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setContatos((prev) => [...prev, { funcao: "outro", nome: "", email: "", telefone: "", cpf: "", registro_crf: "" }])} className="text-sm font-black text-ifood">+ Adicionar contato</button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            {enderecos.map((e, idx) => (
              <div key={idx} className="bg-mist rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase">Endereço {idx + 1}</span>
                  {enderecos.length > 1 && <button type="button" onClick={() => setEnderecos((prev) => prev.filter((_, i) => i !== idx))} className="text-xs text-red-500 hover:underline">Remover</button>}
                </div>
                <SelectField label="Tipo *" value={e.tipo} onChange={(v) => setEnderecos((prev) => prev.map((x, i) => i === idx ? { ...x, tipo: v as any } : x))} options={[{ label: "Entrega", value: "entrega" }, { label: "Faturamento", value: "faturamento" }]} />
                <div className="grid grid-cols-3 gap-3">
                  <Field label="CEP" value={e.cep} onChange={(v) => setEnderecos((prev) => prev.map((x, i) => i === idx ? { ...x, cep: mascaraCEP(v) } : x))} maxLength={9} />
                  <div className="col-span-2"><Field label="Logradouro *" value={e.logradouro} onChange={(v) => setEnderecos((prev) => prev.map((x, i) => i === idx ? { ...x, logradouro: v } : x))} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Número *" value={e.numero} onChange={(v) => setEnderecos((prev) => prev.map((x, i) => i === idx ? { ...x, numero: v } : x))} />
                  <div className="col-span-2"><Field label="Complemento" value={e.complemento} onChange={(v) => setEnderecos((prev) => prev.map((x, i) => i === idx ? { ...x, complemento: v } : x))} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Bairro *" value={e.bairro} onChange={(v) => setEnderecos((prev) => prev.map((x, i) => i === idx ? { ...x, bairro: v } : x))} />
                  <Field label="Cidade *" value={e.cidade} onChange={(v) => setEnderecos((prev) => prev.map((x, i) => i === idx ? { ...x, cidade: v } : x))} />
                  <SelectField label="UF *" value={e.uf} onChange={(v) => setEnderecos((prev) => prev.map((x, i) => i === idx ? { ...x, uf: v } : x))} options={["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map((s) => ({ label: s, value: s }))} />
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setEnderecos((prev) => [...prev, { tipo: "entrega", cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "" }])} className="text-sm font-black text-ifood">+ Adicionar endereço</button>
          </div>
        )}

        {step === 4 && (
          <>
            <Field label="E-mail de acesso *" type="email" value={acesso.email} onChange={(v) => setAcesso((p) => ({ ...p, email: v }))} />
            <Field label="Senha *" type="password" value={acesso.senha} onChange={(v) => setAcesso((p) => ({ ...p, senha: v }))} hint="Mínimo 8 caracteres" />
            <Field label="Confirmar senha *" type="password" value={acesso.senha_confirmacao} onChange={(v) => setAcesso((p) => ({ ...p, senha_confirmacao: v }))} />
          </>
        )}

        <div className="flex items-center justify-between pt-2">
          {step > 1 ? <button type="button" onClick={prev} className="text-sm font-semibold text-gray-500 hover:text-ink">← Voltar</button> : <span />}
          {step < 4 ? (
            <button type="button" onClick={next} className="bg-ifood text-white font-black px-6 py-2.5 rounded-xl hover:bg-ifood-dark">Próximo →</button>
          ) : (
            <button type="submit" disabled={loading} className="bg-ifood text-white font-black px-6 py-2.5 rounded-xl hover:bg-ifood-dark disabled:opacity-50">{loading ? "Enviando…" : "Finalizar cadastro"}</button>
          )}
        </div>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Já tem conta? <Link to="/login" className="text-ifood font-black">Entrar</Link>
      </p>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", maxLength, hint }: { label: string; value: string; onChange: (v: string) => void; type?: string; maxLength?: number; hint?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500">{label}</label>
      <input type={type} value={value} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
      {hint && <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
