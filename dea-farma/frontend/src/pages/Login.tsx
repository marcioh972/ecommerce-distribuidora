import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err?.detail || "E-mail ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto py-8">
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="text-center mb-6">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-ifood text-white font-black">DeA</span>
          <h1 className="text-2xl font-black text-ink mt-3">Entrar</h1>
          <p className="text-sm text-gray-500 font-semibold mt-1">Acesse pedidos e o catálogo da distribuidora.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <div className="bg-ifood-light text-ifood text-sm px-4 py-3 rounded-xl font-bold">{error}</div>}
          <div>
            <label className="text-xs font-black text-gray-500">E-mail</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full bg-mist rounded-xl px-3 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-ifood/30" />
          </div>
          <div>
            <label className="text-xs font-black text-gray-500">Senha</label>
            <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full bg-mist rounded-xl px-3 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-ifood/30" />
          </div>
          <button disabled={loading} className="w-full bg-ifood text-white font-black py-3.5 rounded-xl hover:bg-ifood-dark disabled:opacity-50">
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-5 font-semibold">
          Ainda não tem conta?{" "}
          <Link to="/cadastro" className="text-ifood font-black">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
