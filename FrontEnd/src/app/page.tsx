"use client";
import { useEffect, useState } from "react";
import { apiFetch } from '../lib/api';

// Estilos CSS personalizados para animações
const customStyles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }
  
  .animate-fade-in-up {
    animation: fadeInUp 0.8s ease-out;
  }
  
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
  
  .image-gallery-item {
    animation: fadeInUp 0.6s ease-out;
  }
  
  .image-gallery-item:nth-child(1) { animation-delay: 0.1s; }
  .image-gallery-item:nth-child(2) { animation-delay: 0.2s; }
  .image-gallery-item:nth-child(3) { animation-delay: 0.3s; }
  .image-gallery-item:nth-child(4) { animation-delay: 0.4s; }
  .image-gallery-item:nth-child(5) { animation-delay: 0.5s; }
  .image-gallery-item:nth-child(6) { animation-delay: 0.6s; }
  
  @keyframes glow {
    0%, 100% {
      box-shadow: 0 0 20px rgba(236, 72, 153, 0.3);
    }
    50% {
      box-shadow: 0 0 30px rgba(236, 72, 153, 0.5);
    }
  }
  
  .logo-glow {
    animation: glow 2s ease-in-out infinite;
  }
  
  .nav-link-active {
    background: linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(147, 51, 234, 0.2));
    border-radius: 8px;
  }
  
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
  
  @keyframes sparkle {
    0%, 100% {
      opacity: 0;
      transform: scale(0);
    }
    50% {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .logo-shimmer {
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }
  
  .sparkle-animation {
    animation: sparkle 1.5s infinite;
  }
`;

interface DadosSalao {
  telefone?: string;
  endereco?: string;
  email?: string;
  fotosHome?: string[];
  instagram?: string;
}

export default function Inicio() {
  const [dadosSalao, setDadosSalao] = useState<DadosSalao | null>(null);

  useEffect(() => {
    const fetchDados = async () => {
      try {
        const res = await fetch("dados-salao");
        const data = await res.json();
        setDadosSalao(data);
      } catch (err) {
        console.error('Erro ao buscar dados do salão:', err);
      }
    };

    fetchDados();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'dadosSalaoUpdated') fetchDados();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const imagens = (dadosSalao && dadosSalao.fotosHome) ? dadosSalao.fotosHome : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <main className="min-h-screen font-sans flex flex-col items-center justify-between bg-gradient-to-br from-[#222] to-[#111] text-white">
      <header className="w-full shadow-2xl sticky top-0 z-10 bg-gradient-to-r from-[#111]/95 to-[#222]/95 backdrop-blur-lg text-white border-b border-pink-500/20 relative overflow-hidden">
        {/* Elementos decorativos no header */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full -translate-y-12 translate-x-12"></div>
        <div className="absolute bottom-0 left-1/4 w-16 h-16 bg-purple-500/10 rounded-full translate-y-8"></div>
        
        <nav className="relative z-10 max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          {/* Logo/Brand Section */}
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer">
              {/* Glow externo animado */}
              <div className="absolute -inset-2 bg-gradient-to-r from-pink-500/40 via-purple-500/40 to-pink-500/40 rounded-3xl blur-lg group-hover:blur-xl transition-all duration-500 animate-pulse group-hover:animate-none"></div>
              
              {/* Container principal do logo */}
              <div className="relative bg-gradient-to-br from-[#111] via-[#1a1a1a] to-[#222] p-3 rounded-2xl border-2 border-pink-400/40 group-hover:border-pink-400/70 shadow-2xl group-hover:shadow-pink-500/25 transition-all duration-500">
                {/* Reflexo interno */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-purple-500/10 rounded-2xl"></div>
                
                {/* Imagem do logo com filtros aprimorados */}
                <div className="relative">
                  <img 
                    src="/logo.png" 
                    alt="Espaço Marias" 
                    className="w-20 h-20 object-contain filter drop-shadow-lg group-hover:drop-shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:brightness-125 group-hover:contrast-125 group-hover:saturate-110" 
                    style={{
                      filter: 'brightness(1.2) contrast(1.1) saturate(1.2) hue-rotate(10deg)'
                    }}
                  />
                  
                  {/* Overlay de brilho no hover */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-pink-400/20 to-purple-400/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
                
                {/* Pontos decorativos nos cantos */}
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full shadow-lg shadow-pink-500/50"></div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full shadow-lg shadow-purple-500/50"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
              </div>
              
              {/* Partículas flutuantes */}
              <div className="absolute top-0 left-0 w-1 h-1 bg-pink-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping" style={{animationDelay: '0.2s'}}></div>
              <div className="absolute top-2 right-0 w-1 h-1 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping" style={{animationDelay: '0.5s'}}></div>
              <div className="absolute bottom-0 right-2 w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping" style={{animationDelay: '0.8s'}}></div>
            </div>
            
            {/* Brand name aprimorado */}
            <div className="hidden md:block">
              <h2 className="text-xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-pink-300 bg-clip-text text-transparent leading-tight">
                Espaço Marias
              </h2>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full"></div>
                <p className="text-xs text-gray-400 font-medium">Beleza & Bem-estar</p>
                <div className="w-3 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <ul className="hidden lg:flex items-center gap-6 xl:gap-8">
            <li>
              <a 
                href="/" 
                className="relative px-3 py-2 font-semibold text-pink-400 hover:text-pink-300 transition-all duration-300 group"
              >
                <span className="relative z-10">Início</span>
                <div className="absolute inset-0 bg-pink-500/20 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></div>
              </a>
            </li>
            <li>
              <a 
                href="login" 
                className="relative px-3 py-2 font-semibold text-white hover:text-pink-300 transition-all duration-300 group"
              >
                <span className="relative z-10">Login</span>
                <div className="absolute inset-0 bg-pink-500/20 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></div>
              </a>
            </li>
            <li>
              <a 
                href="manicures" 
                className="relative px-3 py-2 font-semibold text-white hover:text-pink-300 transition-all duration-300 group"
              >
                <span className="relative z-10">Manicures</span>
                <div className="absolute inset-0 bg-pink-500/20 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></div>
              </a>
            </li>
            <li>
              <a 
                href="servicos" 
                className="relative px-3 py-2 font-semibold text-white hover:text-pink-300 transition-all duration-300 group"
              >
                <span className="relative z-10">Serviços</span>
                <div className="absolute inset-0 bg-pink-500/20 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></div>
              </a>
            </li>
            <li>
              <a 
                href="contato" 
                className="relative bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow-lg transition-all transform hover:scale-105 hover:shadow-xl"
              >
                Contato
              </a>
            </li>
          </ul>

          {/* Navigation compacta para tablets */}
          <ul className="hidden md:flex lg:hidden items-center gap-4">
            <li><a href="/" className="text-pink-400 hover:text-pink-300 font-semibold">Início</a></li>
            <li><a href="login" className="text-white hover:text-pink-300 font-semibold">Login</a></li>
            <li><a href="servicos" className="text-white hover:text-pink-300 font-semibold">Serviços</a></li>
            <li>
              <a 
                href="contato" 
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold px-4 py-2 rounded-lg hover:scale-105 transition-transform"
              >
                Contato
              </a>
            </li>
          </ul>

          {/* Mobile menu button (opcional para responsivo futuro) */}
          <div className="md:hidden">
            <button className="text-white hover:text-pink-400 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </nav>
      </header>
      <section className="w-full max-w-7xl flex flex-col items-center mt-12 mb-16 px-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-[#111] to-[#222] rounded-3xl shadow-2xl p-10 mb-12 w-full relative overflow-hidden border border-[#333]/30">
          {/* Decoração de fundo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 rounded-full -translate-y-8 translate-x-8"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/20 rounded-full translate-y-6 -translate-x-6"></div>
          
          <div className="relative z-10 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              ✨ Bem-vindos ao <span className="text-pink-400">Espaço Marias</span>! ✨
            </h1>
            
            <div className="max-w-3xl mx-auto">
              <p className="text-lg md:text-xl text-gray-200 leading-relaxed mb-8 px-4">
                Seu cantinho especial de beleza e bem-estar! Aqui, cada cliente é única e merece cuidados especiais. 
                Oferecemos serviços de manicure e pedicure com todo carinho e dedicação que você merece.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl p-6 backdrop-blur-sm border border-pink-400/30 hover:border-pink-400/50 transition-all">
                  <div className="text-3xl mb-3">💅</div>
                  <h3 className="text-white font-bold mb-2">Manicure & Pedicure</h3>
                  <p className="text-gray-300 text-sm">Cuidados completos para suas unhas com produtos de qualidade</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl p-6 backdrop-blur-sm border border-purple-400/30 hover:border-purple-400/50 transition-all">
                  <div className="text-3xl mb-3">⭐</div>
                  <h3 className="text-white font-bold mb-2">Atendimento Especial</h3>
                  <p className="text-gray-300 text-sm">Profissionais qualificadas e ambiente acolhedor</p>
                </div>
                
                <div className="bg-gradient-to-br from-blue-500/20 to-teal-500/20 rounded-xl p-6 backdrop-blur-sm border border-blue-400/30 hover:border-blue-400/50 transition-all">
                  <div className="text-3xl mb-3">📅</div>
                  <h3 className="text-white font-bold mb-2">Agendamento Online</h3>
                  <p className="text-gray-300 text-sm">Praticidade para marcar seu horário quando quiser</p>
                </div>
              </div>
              
              <div className="mt-8">
                <a 
                  href="/servicos" 
                  className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all transform hover:scale-105 hover:shadow-xl"
                >
                  Ver Nossos Serviços 🌟
                </a>
              </div>
            </div>
          </div>
        </div>
        {/* Galeria de Imagens com Design Atrativo */}
        <div className="w-full">
          <h2 className="text-3xl font-bold text-white text-center mb-8 animate-fade-in-up">
            ✨ Nosso Espaço ✨
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
            {imagens.length > 0 && (
              imagens.map((item: any, idx: number) => {
                const src = typeof item === 'string' ? item : item.url;
                const title = typeof item === 'string' ? '' : (item.title || '');
                const desc = typeof item === 'string' ? '' : (item.description || '');
                return (
                  <div key={idx} className="image-gallery-item group relative overflow-hidden rounded-2xl shadow-2xl bg-gradient-to-b from-[#111] to-[#222]">
                    <div className="aspect-square overflow-hidden">
                      <img 
                        src={src} 
                        alt={`salão ${idx}`} 
                        className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110" 
                      />
                    </div>
                    
                    {/* Overlay com gradiente */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Texto sobreposto */}
                    {(title || desc) && (
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        {title && <h3 className="font-bold text-lg mb-1">{title}</h3>}
                        {desc && <p className="text-sm opacity-90">{desc}</p>}
                      </div>
                    )}
                    
                    {/* Borda decorativa */}
                    <div className="absolute inset-0 border-4 border-pink-500/0 group-hover:border-pink-500/60 rounded-2xl transition-colors duration-300"></div>
                  </div>
                );
              })
            )}
          </div>
          
          {/* Mensagem quando não há imagens */}
          {imagens.length === 0 && (
            <div className="text-center py-16">
              <div className="bg-gradient-to-br from-[#111] to-[#222] rounded-2xl p-8 max-w-md mx-auto border border-pink-500/30">
                <div className="text-6xl mb-4">📸</div>
                <h3 className="text-xl font-bold text-white mb-2">Galeria em Breve</h3>
                <p className="text-gray-300">Estamos preparando lindas fotos do nosso espaço para você!</p>
              </div>
            </div>
          )}
        </div>
      </section>
      <footer className="w-full bg-gradient-to-r from-[#111] to-[#222] text-white border-t border-[#333] py-12 shadow-2xl rounded-t-3xl relative overflow-hidden">
        {/* Decoração de fundo */}
        <div className="absolute top-0 left-1/4 w-20 h-20 bg-pink-500/20 rounded-full -translate-y-10"></div>
        <div className="absolute bottom-0 right-1/3 w-16 h-16 bg-purple-500/20 rounded-full translate-y-8"></div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-4">📍 Venha nos Visitar!</h3>
            {dadosSalao ? (
              <div className="space-y-3">
                <div className="flex flex-wrap justify-center gap-6 text-lg">
                  <span className="flex items-center gap-2">
                    <span className="text-pink-400">📍</span> {dadosSalao.endereco}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-pink-400">📞</span> {dadosSalao.telefone || (dadosSalao as any).phone}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-pink-400">✉️</span> {dadosSalao.email}
                  </span>
                </div>
                
                {dadosSalao.instagram && (
                  <div className="mt-4">
                    <a 
                      href={dadosSalao.instagram.startsWith('http') ? dadosSalao.instagram : `https://instagram.com/${(dadosSalao.instagram || '').replace(/^@/, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105"
                    >
                      <span className="text-xl">📷</span>
                      Siga no Instagram
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="animate-pulse">
                <div className="bg-white/20 rounded-lg h-6 w-64 mx-auto mb-2"></div>
                <div className="bg-white/20 rounded-lg h-4 w-48 mx-auto"></div>
              </div>
            )}
          </div>
          
          <div className="border-t border-white/20 pt-6 text-center">
            <p className="text-gray-300">© 2025 Espaço Marias. Todos os direitos reservados.</p>
            <p className="text-sm text-gray-400 mt-2">Feito com ❤️ para cuidar da sua beleza</p>
          </div>
        </div>
      </footer>
    </main>
    </>
  );
}

