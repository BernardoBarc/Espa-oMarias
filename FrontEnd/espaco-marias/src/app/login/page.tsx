"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
 const authentication = async (e:any) => {
  e.preventDefault();
  setError(null);
  
  if (email != "" && password != "") {
    const formData = { email: email, password: password }
    
    console.log("📤 Dados sendo enviados:", formData);
    
    try {
      const add = await fetch('http://localhost:4000/loginUser', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(formData)
      });
      
      const content = await add.json();
      console.log("✅ Resposta COMPLETA do backend:", content);
      
      if (content.token) {
        console.log("🎉 Login bem-sucedido!");
        const userData = {
          nome: content.name,
          tipo: content.role
        };
        console.log("👤 User data adaptado:", userData);
        sessionStorage.setItem('token', content.token);
        sessionStorage.setItem('user', JSON.stringify(userData));
        // Salva o _id do usuário no sessionStorage (isolado por guia)
        if (content._id) {
          sessionStorage.setItem('userId', content._id);
        }
        router.push('/home');
      } else {
        setError('Credenciais inválidas. Por favor, tente novamente.');
      }
    } catch (error) {
      console.error("Erro no login:", error);
      setError('Erro ao conectar com o servidor.');
    }
  } else {
    setError('Por favor, preencha todos os campos.');
  }
}

  return (
    <main className="min-h-screen font-sans flex flex-col items-center justify-between bg-gradient-to-br from-[#222] to-[#111] text-white relative overflow-hidden">
      {/* Decorações de fundo */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-pink-500/10 rounded-full -translate-x-48 -translate-y-48 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full translate-x-48 translate-y-48 blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/5 rounded-full -translate-x-32 -translate-y-32 blur-2xl"></div>

      {/* Header com logo */}
      <header className="w-full py-8 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex justify-center">
          <div className="flex items-center gap-4">
            <div className="relative group">
              {/* Glow externo animado */}
              <div className="absolute -inset-2 bg-gradient-to-r from-pink-500/40 via-purple-500/40 to-pink-500/40 rounded-3xl blur-lg group-hover:blur-xl transition-all duration-500 animate-pulse"></div>
              
              {/* Container principal do logo */}
              <div className="relative bg-gradient-to-br from-[#111] via-[#1a1a1a] to-[#222] p-3 rounded-2xl border-2 border-pink-400/40 group-hover:border-pink-400/70 shadow-2xl transition-all duration-500">
                {/* Reflexo interno */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-purple-500/10 rounded-2xl"></div>
                
                {/* Imagem do logo */}
                <div className="relative">
                  <img 
                    src="/logo.png" 
                    alt="Espaço Marias" 
                    className="w-16 h-16 object-contain filter drop-shadow-lg transition-all duration-500" 
                    style={{
                      filter: 'brightness(1.2) contrast(1.1) saturate(1.2) hue-rotate(10deg)'
                    }}
                  />
                </div>
                
                {/* Pontos decorativos nos cantos */}
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full shadow-lg shadow-pink-500/50"></div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full shadow-lg shadow-purple-500/50"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-pink-300 bg-clip-text text-transparent">
                Espaço Marias
              </h2>
              <p className="text-sm text-gray-400 font-medium">Beleza & Bem-estar</p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="flex-1 flex items-center justify-center px-6 relative z-10">
        <div className="bg-gradient-to-br from-[#111]/80 to-[#222]/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-full max-w-md border border-pink-500/20 relative">
          {/* Decoração interna */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-500/10 rounded-full translate-y-8 -translate-x-8"></div>
          
          <div className="relative z-10">
            <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              ✨ Entrar ✨
            </h1>
            <p className="text-center text-gray-300 mb-8">
              Acesse sua conta para agendar serviços e gerenciar suas informações
            </p>

            <form className="space-y-6" onSubmit={authentication}>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-pink-400">Email</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  className="w-full p-4 bg-[#222] border-2 border-pink-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/20 transition-all"
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-pink-400">Senha</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full p-4 bg-[#222] border-2 border-pink-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/20 transition-all"
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105 hover:shadow-xl"
              >
                <span className="flex items-center justify-center space-x-2">
                  <span>Entrar</span>
                  <span>🚀</span>
                </span>
              </button>
              
              {error && (
                <div className="p-4 bg-red-500/20 border-2 border-red-500/40 rounded-xl text-red-300 text-sm text-center backdrop-blur-sm">
                  {error}
                </div>
              )}
            </form>

            <div className="text-center mt-8 space-y-4">
              <a 
                href="esqueci-senha" 
                className="block text-pink-400 hover:text-pink-300 transition-colors text-sm font-medium"
              >
                🔐 Esqueci minha senha
              </a>
              
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
                <span className="text-gray-400 text-sm">ou</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
              </div>
              
              <p className="text-gray-300 text-sm">
                Não tem uma conta?{" "}
                <a href="registro" className="text-pink-400 hover:text-pink-300 font-semibold transition-colors">
                  Cadastre-se aqui
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer simples */}
      <footer className="w-full py-6 text-center relative z-10">
        <p className="text-gray-400 text-sm">
          © 2025 Espaço Marias • Feito com ❤️ para cuidar da sua beleza
        </p>
      </footer>
    </main>
  );
}