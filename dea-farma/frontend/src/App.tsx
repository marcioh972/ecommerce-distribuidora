import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Header, Footer, StatusBanner, BottomNav } from "./components";
import { AuthProvider, CartProvider } from "./store";
import Cadastro from "./pages/Cadastro";
import Checkout from "./pages/Checkout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Perfil from "./pages/Perfil";
import ProdutoDetalhe from "./pages/ProdutoDetalhe";
import Produtos from "./pages/Produtos";
import Promocoes from "./pages/Promocoes";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen flex flex-col bg-mist">
            <Header />
            <main className="flex-1 w-full pb-20 md:pb-0">
              <div className="max-w-6xl mx-auto px-4 py-4 md:py-6">
                <div className="mb-3"><StatusBanner /></div>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/produtos" element={<Produtos />} />
                  <Route path="/produtos/:slug" element={<ProdutoDetalhe />} />
                  <Route path="/promocoes" element={<Promocoes />} />
                  <Route path="/cadastro" element={<Cadastro />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/perfil" element={<Perfil />} />
                </Routes>
              </div>
            </main>
            <Footer />
            <BottomNav />
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
