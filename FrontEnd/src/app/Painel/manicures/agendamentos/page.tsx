"use client";
import React, { useEffect, useState } from "react";

interface Agendamento {
  _id: string;
  dataAgendamento: string;
  tempoAproximado: string;
  clientId: string;
  manicureId: string;
  serviceId: string;
  status: string;
  adicionais?: { nome: string; preco: number }[];
}
interface User { _id: string; name: string; role: string; }
interface Servico { _id: string; name: string; preco: number; tempoAproximado: string; }
interface DadosSalao {
  _id?: string;
  phone: string;
  endereco: string;
  email: string;
  instagram?: string;
}

export default function VisualizarSolicitacoes() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<Agendamento[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("pendente");
  const [atualizando, setAtualizando] = useState<string | null>(null);
  const [contadorPendentes, setContadorPendentes] = useState<number>(0);
  
  // Estados para o modal de agendamento
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    serviceId: '',
    dataAgendamento: '',
    horario: ''
  });
  const [clients, setClients] = useState<User[]>([]);

  useEffect(() => {
    fetchSolicitacoes();
  }, [selectedStatus]);

  // Buscar clientes e serviços quando o modal abrir
  useEffect(() => {
    if (showModal) {
      console.log('Carregando clientes e serviços...');
      
      // Carregar clientes
      fetch("http://localhost:4000/users")
        .then(res => res.json())
        .then(data => {
          console.log('Todos os usuários:', data);
          console.log('Roles dos usuários:', data.map((u: User) => ({ name: u.name, role: u.role })));
          
          // Tentar diferentes formas de filtrar clientes
          let clientesData = data.filter((user: User) => user.role === 'cliente');
          
          // Se não encontrar com 'cliente', tentar outras variações
          if (clientesData.length === 0) {
            clientesData = data.filter((user: User) => 
              user.role === 'client' || 
              user.role === 'Cliente' || 
              user.role === 'user' ||
              !user.role || // Usuários sem role definido
              (user.role !== 'admin' && user.role !== 'manicure') // Não admin nem manicure
            );
          }
          
          console.log('Clientes filtrados:', clientesData);
          setClients(clientesData);
        })
        .catch(error => {
          console.error('Erro ao carregar clientes:', error);
        });

      // Carregar serviços (se não estiverem carregados)
      if (servicos.length === 0) {
        fetch("http://localhost:4000/servicos")
          .then(res => res.json())
          .then(data => {
            console.log('Serviços carregados:', data);
            setServicos(data);
          })
          .catch(error => {
            console.error('Erro ao carregar serviços:', error);
          });
      }
    }
  }, [showModal]);

  // Polling para verificar mudanças em tempo real apenas para agendamentos pendentes
  useEffect(() => {
    if (selectedStatus !== "pendente") return;
    
    const interval = setInterval(async () => {
      if (atualizando) return; // Não verificar se estiver atualizando algo
      
      try {
        const response = await fetch("http://localhost:4000/agendamentos");
        const agendamentos = await response.json();
        const userId = sessionStorage.getItem('userId');
        
        const pendentesAtuais = agendamentos.filter(
          (ag: Agendamento) => ag.manicureId === userId && ag.status === "pendente"
        );
        
        // Verificar se algum agendamento pendente foi removido/cancelado
        const idsAtuais = pendentesAtuais.map((ag: Agendamento) => ag._id);
        const idsLocais = solicitacoes.map(ag => ag._id);
        
        const foramRemovidos = idsLocais.some(id => !idsAtuais.includes(id));
        
        if (foramRemovidos) {
          console.log('Detectadas mudanças nos agendamentos pendentes. Atualizando...');
          await fetchSolicitacoes();
        }
      } catch (error) {
        console.error('Erro no polling de agendamentos:', error);
      }
    }, 10000); // Verificar a cada 10 segundos
    
    return () => clearInterval(interval);
  }, [selectedStatus, solicitacoes, atualizando]);

  const fetchSolicitacoes = async () => {
    setLoading(true);
    try {
      const [ags, us, ss] = await Promise.all([
        fetch("http://localhost:4000/agendamentos").then(r => r.json()),
        fetch("http://localhost:4000/users").then(r => r.json()),
        fetch("http://localhost:4000/servicos").then(r => r.json()),
      ]);
      // Recupera o id da manicure logada
      const userId = sessionStorage.getItem('userId');
      
      // Calcula a contagem real de agendamentos pendentes da manicure
      const pendentesCount = ags.filter(
        (ag: Agendamento) => ag.manicureId === userId && ag.status === "pendente"
      ).length;
      setContadorPendentes(pendentesCount);
      
      // Filtra apenas os agendamentos da manicure logada com o status selecionado
      const agsFiltrados = ags.filter(
        (ag: Agendamento) => ag.manicureId === userId && ag.status === selectedStatus
      );
      setSolicitacoes(agsFiltrados);
      setUsers(us);
      setServicos(ss);
    } catch (err) {
      console.error("Erro ao buscar dados");
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatus = async (id: string, novoStatus: string) => {
    setAtualizando(id);
    try {
      const token = sessionStorage.getItem('token');
      
      const response = await fetch(`http://localhost:4000/atualizarAgendamentos/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: novoStatus }),
      });

      if (response.ok) {
        // Atualizar a lista localmente removendo o item que mudou de status
        setSolicitacoes(prev => prev.filter(ag => ag._id !== id));
        
        // Se estava em "pendente" e mudou para outro status, diminuir contador
        if (selectedStatus === "pendente" && novoStatus !== "pendente") {
          setContadorPendentes(prev => Math.max(0, prev - 1));
        }
        
        console.log(`Agendamento ${novoStatus} com sucesso!`);
      } else {
        // Tratar erros específicos de conflito
        const errorData = await response.json().catch(() => null);
        
        if (response.status === 409 && errorData) {
          // Conflito: apenas quando agendamento PENDENTE foi alterado simultaneamente
          if (errorData.code === 'AGENDAMENTO_JA_CANCELADO') {
            alert('⚠️ Este agendamento pendente já foi cancelado pelo cliente. A página será atualizada.');
          } else {
            alert(`⚠️ ${errorData.error}`);
          }
          
          // ATUALIZAR A PÁGINA AUTOMATICAMENTE
          console.log('Atualizando lista de agendamentos devido a conflito...');
          await fetchSolicitacoes();
        } else if (response.status === 404 && errorData?.code === 'AGENDAMENTO_NAO_ENCONTRADO') {
          alert('⚠️ Este agendamento não foi encontrado. Pode ter sido removido.');
          // ATUALIZAR A PÁGINA AUTOMATICAMENTE
          console.log('Atualizando lista de agendamentos devido a agendamento não encontrado...');
          await fetchSolicitacoes();
        } else {
          console.error("Erro ao atualizar status");
          alert("Erro ao atualizar o agendamento. Tente novamente.");
        }
      }
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      alert("Erro ao atualizar o agendamento. Tente novamente.");
    } finally {
      setAtualizando(null);
    }
  };



  // Função para criar agendamento manual
  const criarAgendamento = async () => {
    if (!formData.clientId || !formData.serviceId || !formData.dataAgendamento || !formData.horario) {
      alert('Por favor, preencha todos os campos!');
      return;
    }

    try {
      const manicureId = sessionStorage.getItem('userId');
      const dataCompleta = `${formData.dataAgendamento}T${formData.horario}:00`;
      
      // Buscar o serviço selecionado para obter o tempo aproximado
      const servicoSelecionado = servicos.find(s => s._id === formData.serviceId);
      
      console.log('Serviço selecionado:', servicoSelecionado);
      console.log('Todos os serviços:', servicos);
      
      console.log('Dados do agendamento:', {
        clientId: formData.clientId,
        manicureId: manicureId,
        serviceId: formData.serviceId,
        dataAgendamento: dataCompleta,
        tempoAproximado: servicoSelecionado?.tempoAproximado || '60',
        status: 'confirmado'
      });
      
      const token = sessionStorage.getItem('token');
      
      const response = await fetch('http://localhost:4000/criarAgendamentos', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          clientId: formData.clientId,
          manicureId: manicureId,
          serviceId: formData.serviceId,
          dataAgendamento: dataCompleta,
          tempoAproximado: servicoSelecionado?.tempoAproximado || '60', // Tempo padrão se não encontrar
          status: 'confirmado', // Agendamento manual já vai como confirmado
          adicionais: [] // Sem adicionais por enquanto
        })
      });

      console.log('Resposta da API:', response);

      if (response.ok) {
        const resultado = await response.json();
        console.log('Agendamento criado:', resultado);
        alert('Agendamento criado com sucesso!');
        setShowModal(false);
        setFormData({ clientId: '', serviceId: '', dataAgendamento: '', horario: '' });
        fetchSolicitacoes(); // Atualizar a lista
      } else {
        console.error('Erro na resposta:', response.status, response.statusText);
        try {
          const errorData = await response.json();
          console.error('Dados do erro:', errorData);
          alert(`Erro: ${errorData.error || errorData.message || 'Não foi possível criar o agendamento'}`);
        } catch (parseError) {
          console.error('Erro ao fazer parse do erro:', parseError);
          alert(`Erro ${response.status}: ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      alert('Erro ao criar agendamento. Tente novamente.');
    }
  };

  const userMap = Object.fromEntries(users.map(u => [u._id, u.name]));
  const servicoMap = Object.fromEntries(servicos.map(s => [s._id, s.name]));
  const servicoValorMap = Object.fromEntries(servicos.map(s => [s._id, s.preco]));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendente": return "bg-yellow-500";
      case "confirmado": return "bg-green-500";
      case "cancelado": return "bg-red-500";
      case "concluido": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pendente": return "Pendente";
      case "confirmado": return "Confirmado";
      case "cancelado": return "Cancelado";
      case "concluido": return "Concluído";
      default: return status;
    }
  };

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
              <p className="text-sm text-gray-400 font-medium">Gerenciar Agendamentos</p>
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
            📅 Solicitações de Agendamento
          </h1>
          <p className="text-center text-gray-300 mb-8">
            Gerencie e organize todos os seus agendamentos de forma eficiente
          </p>
          
          {/* Seção Criar Novo Agendamento */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-emerald-500/20 mb-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="text-center lg:text-left">
                <div className="flex items-center gap-3 mb-3 justify-center lg:justify-start">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                  <h2 className="text-2xl font-bold text-emerald-400">🗓️ Criar Novo Agendamento</h2>
                </div>
                <p className="text-gray-300 text-lg max-w-md">
                  Agende horários diretamente para seus clientes de forma rápida e prática
                </p>
              </div>
              <button 
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-emerald-500/25 flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold">+</span>
                </div>
                Novo Agendamento
              </button>
            </div>
          </div>

          {/* Filtros de Status */}
          <div className="bg-gradient-to-br from-[#111]/80 to-[#222]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden mb-8">
            {/* Decoração interna */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-500/10 rounded-full translate-y-8 -translate-x-8"></div>
            
            <div className="relative z-10 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50"></div>
                  <h2 className="text-blue-400 font-bold text-2xl">🔍 Filtros de Status</h2>
                </div>
              </div>
              
              <div className="flex gap-4 flex-wrap">
                {[
                  { value: "pendente", label: "Pendentes", count: agendamentos.length, icon: "⏳" },
                  { value: "confirmado", label: "Confirmados", icon: "✅" },
                  { value: "cancelado", label: "Cancelados", icon: "❌" },
                  { value: "concluido", label: "Concluídos", icon: "🎉" }
                ].map(({ value, label, count, icon }) => (
                <button
                  key={value}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                    selectedStatus === value
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30"
                      : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                  }`}
                  onClick={() => setSelectedStatus(value)}
                >
                  <div className="flex items-center gap-2">
                    <span>{icon}</span>
                    <span>{label}</span>
                    {value === "pendente" && (count ?? 0) > 0 && (
                      <span className="bg-white/30 px-2 py-1 rounded-full text-xs font-bold">
                        {count ?? 0}
                      </span>
                    )}
                  </div>
                </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lista de Agendamentos */}
          <div className="bg-gradient-to-br from-[#111]/80 to-[#222]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden">
            {/* Decoração interna */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/10 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-500/10 rounded-full translate-y-8 -translate-x-8"></div>
            
            <div className="relative z-10 p-8">
              {loading ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-3xl">⏳</span>
                  </div>
                  <p className="text-blue-400 text-lg font-medium">Carregando solicitações...</p>
                </div>
              ) : solicitacoes.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gray-500/20 rounded-full flex items-center justify-center">
                    <span className="text-4xl">📋</span>
                  </div>
                  <p className="text-2xl font-bold text-white mb-2">
                    Nenhuma solicitação {getStatusText(selectedStatus).toLowerCase()} encontrada
                  </p>
                  <p className="text-gray-400 text-lg">
                    Todas as solicitações estão em dia! 🎉
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {solicitacoes.map(sol => (
                    <div key={sol._id} className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 hover:border-white/40 transition-all shadow-lg hover:shadow-xl">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-white font-bold text-xl">
                              {userMap[sol.clientId] || "Cliente não encontrado"}
                            </h3>
                            <span className={`px-3 py-1 rounded-lg text-white text-xs font-bold shadow-lg ${
                              sol.status === "pendente" ? "bg-gradient-to-r from-amber-500 to-orange-500" :
                              sol.status === "confirmado" ? "bg-gradient-to-r from-emerald-500 to-green-500" :
                              sol.status === "cancelado" ? "bg-gradient-to-r from-red-500 to-pink-500" :
                              "bg-gradient-to-r from-blue-500 to-indigo-500"
                            }`}>
                              {sol.status === "pendente" ? "⏳" : 
                               sol.status === "confirmado" ? "✅" :
                               sol.status === "cancelado" ? "❌" : "🏆"} {getStatusText(sol.status)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Informações do Serviço */}
                            <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/30">
                              <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-2 text-sm">
                                ✨ Serviço Solicitado
                              </h4>
                              <p className="text-white font-semibold text-base mb-1">
                                {servicoMap[sol.serviceId] || "Serviço não encontrado"}
                              </p>
                              <p className="text-emerald-400 font-bold text-lg mb-2">
                                R$ {servicoValorMap[sol.serviceId]?.toFixed(2) || '0.00'}
                              </p>
                              
                              {Array.isArray(sol.adicionais) && sol.adicionais.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  <p className="font-semibold text-blue-300 text-xs">Serviços Adicionais:</p>
                                  {sol.adicionais.map((ad: any, idx: number) => {
                                    const qtd = ad.quantidade ?? 1;
                                    const valorTotal = Number(ad.preco) * qtd;
                                    return (
                                      <div key={idx} className="bg-white/5 px-2 py-1 rounded text-sm">
                                        <span className="text-white font-medium">
                                          {ad.nome} {qtd > 1 ? `(${qtd}x)` : ''}
                                        </span>
                                        <span className="text-emerald-400 font-bold ml-2">
                                          +R$ {valorTotal.toFixed(2)}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            
                            {/* Informações de Data e Horário */}
                            <div className="bg-purple-500/10 p-3 rounded-lg border border-purple-500/30">
                              <h4 className="font-bold text-purple-400 mb-2 flex items-center gap-2 text-sm">
                                📅 Data e Horário
                              </h4>
                              <p className="text-white font-bold text-base mb-1">
                                {new Date(sol.dataAgendamento).toLocaleDateString('pt-BR')}
                              </p>
                              <p className="text-white font-semibold text-base mb-2">
                                {new Date(sol.dataAgendamento).toLocaleTimeString('pt-BR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                              <p className="text-purple-300 font-medium text-sm">
                                ⏱️ Duração: {sol.tempoAproximado}
                              </p>
                              
                              {sol.manicureId && (
                                <div className="mt-2 pt-2 border-t border-purple-500/30">
                                  <p className="font-semibold text-purple-300 text-xs mb-1">Profissional:</p>
                                  <p className="text-white font-medium text-sm">
                                    {userMap[sol.manicureId] || "Não atribuído"}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Botões de Ação */}
                      {selectedStatus === "pendente" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-white/20">
                          <button
                            onClick={() => atualizarStatus(sol._id, "confirmado")}
                            disabled={atualizando === sol._id}
                            className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg text-sm"
                          >
                            {atualizando === sol._id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Confirmando...
                              </>
                            ) : (
                              <>
                                <span className="text-lg">✅</span>
                                Confirmar
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => atualizarStatus(sol._id, "cancelado")}
                            disabled={atualizando === sol._id}
                            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg text-sm"
                          >
                            {atualizando === sol._id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Cancelando...
                              </>
                            ) : (
                              <>
                                <span className="text-lg">❌</span>
                                Recusar
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {selectedStatus === "confirmado" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-white/20">
                          <button
                            onClick={() => atualizarStatus(sol._id, "concluido")}
                            disabled={atualizando === sol._id}
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg text-sm"
                          >
                            {atualizando === sol._id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Finalizando...
                              </>
                            ) : (
                              <>
                                <span className="text-lg">🏆</span>
                                Marcar Concluído
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => atualizarStatus(sol._id, "cancelado")}
                            disabled={atualizando === sol._id}
                            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg text-sm"
                          >
                            <span className="text-lg mr-2">❌</span>
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Agendamento Manual */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#111]/95 to-[#222]/95 backdrop-blur-xl p-8 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 relative">
            {/* Decoração do modal */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -translate-y-12 translate-x-12"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-blue-500/10 rounded-full translate-y-10 -translate-x-10"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                  ✨ Novo Agendamento
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white text-3xl transition-colors hover:scale-110 transform"
                >
                  ×
                </button>
              </div>

              <form className="space-y-8">
                {/* Seção Cliente */}
                <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6 rounded-2xl border border-blue-500/30">
                  <h3 className="text-blue-400 font-bold text-lg mb-4 flex items-center gap-2">
                    👤 Seleção do Cliente
                  </h3>
                  <select
                    value={formData.clientId}
                    onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                    className="w-full p-4 bg-white/10 text-white rounded-xl border border-white/20 focus:border-blue-500 focus:outline-none transition-all placeholder-gray-400"
                  >
                    <option value="" className="bg-gray-800 text-gray-400">Selecione um cliente</option>
                    {clients.map(client => (
                      <option key={client._id} value={client._id} className="bg-gray-800 text-white">
                        {client.name}
                      </option>
                    ))}
                  </select>
                  
                  {clients.length === 0 && (
                    <div className="text-sm text-red-400 mt-3 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                      <p className="font-semibold">❌ Nenhum cliente encontrado.</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Verifique o Console (F12) para mais detalhes sobre os usuários carregados.
                      </p>
                    </div>
                  )}
                </div>

                {/* Seção Serviço */}
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 rounded-2xl border border-purple-500/30">
                  <h3 className="text-purple-400 font-bold text-lg mb-4 flex items-center gap-2">
                    💅 Seleção do Serviço
                  </h3>
                  <select
                    value={formData.serviceId}
                    onChange={(e) => setFormData({...formData, serviceId: e.target.value})}
                    className="w-full p-4 bg-white/10 text-white rounded-xl border border-white/20 focus:border-purple-500 focus:outline-none transition-all placeholder-gray-400"
                  >
                    <option value="" className="bg-gray-800 text-gray-400">Selecione um serviço</option>
                    {servicos.map(servico => (
                      <option key={servico._id} value={servico._id} className="bg-gray-800 text-white">
                        {servico.name} - R$ {servico.preco.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Seção Data e Horário */}
                <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 p-6 rounded-2xl border border-emerald-500/30">
                  <h3 className="text-emerald-400 font-bold text-lg mb-4 flex items-center gap-2">
                    📅 Data e Horário
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-emerald-300 font-semibold mb-2">Data</label>
                      <input
                        type="date"
                        value={formData.dataAgendamento}
                        onChange={(e) => setFormData({...formData, dataAgendamento: e.target.value})}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full p-4 bg-white/10 text-white rounded-xl border border-white/20 focus:border-emerald-500 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-emerald-300 font-semibold mb-2">Horário</label>
                      <input
                        type="time"
                        value={formData.horario}
                        onChange={(e) => setFormData({...formData, horario: e.target.value})}
                        className="w-full p-4 bg-white/10 text-white rounded-xl border border-white/20 focus:border-emerald-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-6 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white py-4 px-6 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg"
                  >
                    ❌ Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={criarAgendamento}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white py-4 px-6 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg"
                  >
                    ✨ Agendar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}