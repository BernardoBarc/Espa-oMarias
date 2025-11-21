"use client";
import React, { useEffect, useState } from "react";

interface Agendamento {
  _id: string;
  dataAgendamento: string;
  tempoAproximado: string;
  clientId: string;
  manicureId: string;
  serviceId: string;
  status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido';
  adicionais?: Array<{
    nome: string;
    preco: number;
    quantidade?: number;
  }>;
}

interface Manicure {
  _id: string;
  name: string;
  phone?: string; // Adicionado para integração com WhatsApp
}

interface Servico {
  _id: string;
  name: string;
  preco: number;
  tempoAproximado: string;
}

function formatPhoneForWhatsapp(phone?: string) {
  if (!phone) return '5599999999999';
  // Remove tudo que não for número
  const onlyNumbers = phone.replace(/\D/g, '');
  // Se começar com 55, retorna direto, senão adiciona 55
  if (onlyNumbers.startsWith('55')) return onlyNumbers;
  return '55' + onlyNumbers;
}

export default function HistoricoComponent() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [manicures, setManicures] = useState<Manicure[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  // Polling para verificar mudanças em tempo real nos agendamentos do cliente
  useEffect(() => {
    const interval = setInterval(async () => {
      if (loading) return; // Não verificar se estiver carregando algo
      
      try {
        const response = await fetch("agendamentos");
        const agendamentos = await response.json();
        const userId = sessionStorage.getItem('userId') || 'user-id-placeholder';
        
        const agendamentosAtuais = agendamentos.filter(
          (ag: Agendamento) => ag.clientId === userId
        );
        
        // Verificar se algum agendamento teve mudança de status
        const statusChanged = agendamentosAtuais.some((agAtual: Agendamento) => {
          const agLocal = agendamentos.find((ag: Agendamento) => ag._id === agAtual._id);
          return agLocal && agLocal.status !== agAtual.status;
        });
        
        if (statusChanged) {
          console.log('Detectadas mudanças nos agendamentos do cliente. Atualizando...');
          await fetchAll();
        }
      } catch (error) {
        console.error('Erro no polling de agendamentos do cliente:', error);
      }
    }, 15000); // Verificar a cada 15 segundos
    
    return () => clearInterval(interval);
  }, [agendamentos, loading]);

  const fetchAll = async () => {
    try {
      const [ags, ms, ss] = await Promise.all([
        fetch("agendamentos").then(r => r.json()),
        fetch("users?role=manicure").then(r => r.json()),
        fetch("servicos").then(r => r.json()),
      ]);
      
      const userId = sessionStorage.getItem('userId') || 'user-id-placeholder';
      const userAgendamentos = ags.filter((ag: Agendamento) => ag.clientId === userId);
      setAgendamentos(userAgendamentos);
      setManicures(ms);
      setServicos(ss);
    } catch (err) {
      setError("Erro ao buscar dados");
    }
  };

  const cancelarAgendamento = async (id: string) => {
    if (!confirm("Tem certeza que deseja cancelar este agendamento?")) return;

    setLoading(true);
    try {
      const response = await fetch(`atualizarAgendamentos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: 'cancelado' }),
      });

      if (response.ok) {
        setSuccess("Agendamento cancelado com sucesso!");
        fetchAll();
      } else {
        // Tratar erros específicos de conflito
        const errorData = await response.json().catch(() => null);
        
        if (response.status === 409 && errorData) {
          // Conflito: apenas quando agendamento PENDENTE foi alterado simultaneamente
          if (errorData.code === 'AGENDAMENTO_JA_CONFIRMADO') {
            alert('⚠️ Este agendamento pendente já foi confirmado pela manicure. A página será atualizada.');
          } else {
            alert(`⚠️ ${errorData.error}`);
          }
          
          // ATUALIZAR A PÁGINA AUTOMATICAMENTE
          console.log('Atualizando lista de agendamentos devido a conflito...');
          await fetchAll();
        } else if (response.status === 404 && errorData?.code === 'AGENDAMENTO_NAO_ENCONTRADO') {
          alert('⚠️ Este agendamento não foi encontrado. Pode ter sido removido.');
          // ATUALIZAR A PÁGINA AUTOMATICAMENTE
          console.log('Atualizando lista de agendamentos devido a agendamento não encontrado...');
          await fetchAll();
        } else {
          throw new Error("Erro ao cancelar agendamento");
        }
      }
    } catch (err: any) {
      setError(err.message || "Erro ao cancelar agendamento");
    } finally {
      setLoading(false);
    }
  };

  const getManicurePhone = (manicureId: string) => {
    const manicure = manicures.find(m => m._id === manicureId);
    return formatPhoneForWhatsapp(manicure?.phone);
  };

  const manicureMap = Object.fromEntries(manicures.map(m => [m._id, m.name]));
  const servicoMap = Object.fromEntries(servicos.map(s => [s._id, s.name]));
  const servicoValorMap = Object.fromEntries(servicos.map(s => [s._id, s.preco]));
  const manicurePhoneMap = Object.fromEntries(manicures.map(m => [m._id, m.phone || '5599999999999'])); // Placeholder se não houver campo phone

  const agendamentosRealizados = agendamentos.filter(a => a.status === 'concluido');
  const agendamentosPendentes = agendamentos.filter(a => a.status === 'pendente');
  const agendamentosConfirmados = agendamentos.filter(a => a.status === 'confirmado');

  return (
    <main className="min-h-screen font-sans flex flex-col bg-gradient-to-br from-[#222] to-[#111] text-white relative overflow-hidden">
      {/* Decorações de fundo */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-pink-500/10 rounded-full -translate-x-48 -translate-y-48 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full translate-x-48 translate-y-48 blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/5 rounded-full -translate-x-32 -translate-y-32 blur-2xl"></div>

      {/* Header com logo */}
      <header className="w-full py-8 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
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
              <p className="text-sm text-gray-400 font-medium">Histórico de Agendamentos</p>
            </div>
          </div>

          {/* Botão de voltar */}
          <a 
            href="/home" 
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
          >
            🏠 Voltar ao Painel
          </a>
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="flex-1 px-6 py-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            📋 Histórico de Agendamentos
          </h1>
          <p className="text-center text-gray-300 mb-8">
            Acompanhe todos os seus agendamentos: pendentes, confirmados e concluídos
          </p>

          <div className="space-y-8">
            {/* Agendamentos Pendentes */}
            {agendamentosPendentes.length > 0 && (
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-amber-500/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse shadow-lg shadow-amber-400/50"></div>
                  <h2 className="text-2xl font-bold text-amber-400">⏳ Agendamentos Pendentes</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-amber-400/50 to-transparent"></div>
                  <span className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-sm font-semibold">
                    {agendamentosPendentes.length} agendamento{agendamentosPendentes.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-amber-500/30">
                        <th className="px-6 py-4 text-left text-amber-300 font-bold">📅 Data</th>
                        <th className="px-6 py-4 text-left text-amber-300 font-bold">⏰ Horário</th>
                        <th className="px-6 py-4 text-left text-amber-300 font-bold">👩‍💼 Manicure</th>
                        <th className="px-6 py-4 text-left text-amber-300 font-bold">✨ Serviço</th>
                        <th className="px-6 py-4 text-left text-amber-300 font-bold">💰 Valor</th>
                        <th className="px-6 py-4 text-left text-amber-300 font-bold">🎯 Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agendamentosPendentes.map((ag) => (
                        <tr key={ag._id} className="border-b border-white/10 hover:bg-amber-500/5 transition-all group">
                          <td className="px-6 py-4 text-white font-medium">
                            {new Date(ag.dataAgendamento).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 text-white font-medium">
                            {new Date(ag.dataAgendamento).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </td>
                          <td className="px-6 py-4 text-white font-medium">
                            {manicureMap[ag.manicureId] || ag.manicureId}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-white font-medium">
                              {servicoMap[ag.serviceId] || ag.serviceId}
                            </div>
                            {Array.isArray(ag.adicionais) && ag.adicionais.length > 0 && (
                              <div className="mt-2 space-y-1">
                                <span className="text-xs text-amber-300 font-bold">Adicionais:</span>
                                {ag.adicionais.map((ad: any, idx: number) => {
                                  const qtd = ad.quantidade ?? 1;
                                  const valorTotal = Number(ad.preco) * qtd;
                                  return (
                                    <div key={idx} className="text-xs text-gray-300 bg-white/5 px-2 py-1 rounded">
                                      {ad.nome} {qtd > 1 ? `(${qtd}x)` : ''} 
                                      <span className="text-emerald-400 ml-1 font-semibold">+R$ {valorTotal.toFixed(2)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-amber-400 font-bold text-lg">
                              {(() => {
                                const valorServico = servicoValorMap[ag.serviceId] || 0;
                                let valorAdicionais = 0;
                                if (Array.isArray(ag.adicionais)) {
                                  valorAdicionais = ag.adicionais.reduce((acc: number, ad: any) => acc + (Number(ad.preco) * (ad.quantidade ?? 1)), 0);
                                }
                                return `R$ ${(valorServico + valorAdicionais).toFixed(2)}`;
                              })()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {(function() {
                              const agora = new Date();
                              const dataAg = new Date(ag.dataAgendamento);
                              const diffMs = dataAg.getTime() - agora.getTime();
                              const diffHoras = diffMs / (1000 * 60 * 60);
                              const phone = getManicurePhone(ag.manicureId);
                              const whatsappUrl = `https://wa.me/${phone}`;
                              return (
                                <div className="flex items-center gap-2">
                                  {diffHoras > 12 ? (
                                    <button
                                      className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                                      onClick={() => cancelarAgendamento(ag._id)}
                                      disabled={loading}
                                    >
                                      ❌ Cancelar
                                    </button>
                                  ) : (
                                    <span className="text-xs text-amber-300 font-bold bg-amber-500/20 px-3 py-2 rounded-lg">
                                      📞 Cancelamento apenas com a manicure
                                    </span>
                                  )}
                                  <a
                                    href={whatsappUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                                    title="Conversar no WhatsApp"
                                  >
                                    💬
                                  </a>
                                </div>
                              );
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Agendamentos Confirmados */}
            {agendamentosConfirmados.length > 0 && (
              <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-emerald-500/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                  <h2 className="text-2xl font-bold text-emerald-400">✅ Agendamentos Confirmados</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-emerald-400/50 to-transparent"></div>
                  <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-sm font-semibold">
                    {agendamentosConfirmados.length} agendamento{agendamentosConfirmados.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-emerald-500/30">
                        <th className="px-6 py-4 text-left text-emerald-300 font-bold">📅 Data</th>
                        <th className="px-6 py-4 text-left text-emerald-300 font-bold">⏰ Horário</th>
                        <th className="px-6 py-4 text-left text-emerald-300 font-bold">👩‍💼 Manicure</th>
                        <th className="px-6 py-4 text-left text-emerald-300 font-bold">✨ Serviço</th>
                        <th className="px-6 py-4 text-left text-emerald-300 font-bold">💰 Valor</th>
                        <th className="px-6 py-4 text-left text-emerald-300 font-bold">🎯 Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agendamentosConfirmados.map((ag) => (
                        <tr key={ag._id} className="border-b border-white/10 hover:bg-emerald-500/5 transition-all group">
                          <td className="px-6 py-4 text-white font-medium">
                            {new Date(ag.dataAgendamento).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 text-white font-medium">
                            {new Date(ag.dataAgendamento).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </td>
                          <td className="px-6 py-4 text-white font-medium">
                            {manicureMap[ag.manicureId] || ag.manicureId}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-white font-medium">
                              {servicoMap[ag.serviceId] || ag.serviceId}
                            </div>
                            {Array.isArray(ag.adicionais) && ag.adicionais.length > 0 && (
                              <div className="mt-2 space-y-1">
                                <span className="text-xs text-emerald-300 font-bold">Adicionais:</span>
                                {ag.adicionais.map((ad: any, idx: number) => {
                                  const qtd = ad.quantidade ?? 1;
                                  const valorTotal = Number(ad.preco) * qtd;
                                  return (
                                    <div key={idx} className="text-xs text-gray-300 bg-white/5 px-2 py-1 rounded">
                                      {ad.nome} {qtd > 1 ? `(${qtd}x)` : ''} 
                                      <span className="text-emerald-400 ml-1 font-semibold">+R$ {valorTotal.toFixed(2)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-emerald-400 font-bold text-lg">
                              {(() => {
                                const valorServico = servicoValorMap[ag.serviceId] || 0;
                                let valorAdicionais = 0;
                                if (Array.isArray(ag.adicionais)) {
                                  valorAdicionais = ag.adicionais.reduce((acc: number, ad: any) => acc + (Number(ad.preco) * (ad.quantidade ?? 1)), 0);
                                }
                                return `R$ ${(valorServico + valorAdicionais).toFixed(2)}`;
                              })()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {(function() {
                              const phone = getManicurePhone(ag.manicureId);
                              const whatsappUrl = `https://wa.me/${phone}`;
                              return (
                                <div className="flex items-center gap-2">
                                  <button
                                    className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                                    onClick={() => cancelarAgendamento(ag._id)}
                                    disabled={loading}
                                  >
                                    ❌ Cancelar
                                  </button>
                                  <a
                                    href={whatsappUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                                    title="Conversar no WhatsApp"
                                  >
                                    💬
                                  </a>
                                </div>
                              );
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Histórico de Serviços Concluídos */}
            <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-blue-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50"></div>
                <h2 className="text-2xl font-bold text-blue-400">🏆 Histórico de Serviços Concluídos</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-blue-400/50 to-transparent"></div>
                <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm font-semibold">
                  {agendamentosRealizados.length} serviço{agendamentosRealizados.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              {agendamentosRealizados.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <span className="text-4xl">💅</span>
                  </div>
                  <p className="text-blue-300 text-lg font-medium">Nenhum serviço concluído ainda</p>
                  <p className="text-gray-400 text-sm mt-2">Seus serviços finalizados aparecerão aqui</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-blue-500/30">
                        <th className="px-6 py-4 text-left text-blue-300 font-bold">📅 Data</th>
                        <th className="px-6 py-4 text-left text-blue-300 font-bold">⏰ Horário</th>
                        <th className="px-6 py-4 text-left text-blue-300 font-bold">👩‍💼 Manicure</th>
                        <th className="px-6 py-4 text-left text-blue-300 font-bold">✨ Serviço</th>
                        <th className="px-6 py-4 text-left text-blue-300 font-bold">💰 Valor</th>
                        <th className="px-6 py-4 text-left text-blue-300 font-bold">⏱️ Duração</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agendamentosRealizados.map((ag) => (
                        <tr key={ag._id} className="border-b border-white/10 hover:bg-blue-500/5 transition-all group">
                          <td className="px-6 py-4 text-white font-medium">
                            {new Date(ag.dataAgendamento).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 text-white font-medium">
                            {new Date(ag.dataAgendamento).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </td>
                          <td className="px-6 py-4 text-white font-medium">
                            {manicureMap[ag.manicureId] || ag.manicureId}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-white font-medium">
                              {servicoMap[ag.serviceId] || ag.serviceId}
                            </div>
                            {Array.isArray(ag.adicionais) && ag.adicionais.length > 0 && (
                              <div className="mt-2 space-y-1">
                                <span className="text-xs text-blue-300 font-bold">Adicionais:</span>
                                {ag.adicionais.map((ad: any, idx: number) => {
                                  const qtd = ad.quantidade ?? 1;
                                  const valorTotal = Number(ad.preco) * qtd;
                                  return (
                                    <div key={idx} className="text-xs text-gray-300 bg-white/5 px-2 py-1 rounded">
                                      {ad.nome} {qtd > 1 ? `(${qtd}x)` : ''} 
                                      <span className="text-emerald-400 ml-1 font-semibold">+R$ {valorTotal.toFixed(2)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-blue-400 font-bold text-lg">
                              {(() => {
                                const valorServico = servicoValorMap[ag.serviceId] || 0;
                                let valorAdicionais = 0;
                                if (Array.isArray(ag.adicionais)) {
                                  valorAdicionais = ag.adicionais.reduce((acc: number, ad: any) => acc + (Number(ad.preco) * (ad.quantidade ?? 1)), 0);
                                }
                                return `R$ ${(valorServico + valorAdicionais).toFixed(2)}`;
                              })()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-blue-300 font-medium">
                            {ag.tempoAproximado}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Mensagens de Feedback */}
            {error && (
              <div className="p-6 bg-red-500/20 backdrop-blur-sm border border-red-500/50 rounded-xl text-red-200 text-center font-medium">
                ❌ {error}
              </div>
            )}

            {success && (
              <div className="p-6 bg-green-500/20 backdrop-blur-sm border border-green-500/50 rounded-xl text-green-200 text-center font-medium">
                ✅ {success}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
