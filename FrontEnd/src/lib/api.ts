// Configuração da URL da API
// Automaticamente detecta se está em desenvolvimento ou produção

const getApiUrl = (): string => {
  // Em produção (Vercel), usar a variável de ambiente
  if (process.env.NODE_ENV === 'production') {
    const prodUrl = process.env.NEXT_PUBLIC_API_URL || 'https://authentic-flow-production.up.railway.app';
    return prodUrl;
  }
  
  // Em desenvolvimento, usar localhost
  const devUrl = 'http://localhost:4000';
  console.log('🔧 Modo DESENVOLVIMENTO - API URL:', devUrl);
  return devUrl;
};

export const API_URL = getApiUrl();

// Helper function para fazer fetch com a URL correta
export const apiUrl = (endpoint: string): string => {
  // Remove a barra inicial se existir
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const fullUrl = `${API_URL}/${cleanEndpoint}`;
  
  // Log apenas em desenvolvimento
  if (process.env.NODE_ENV !== 'production') {
    console.log('📡 Fazendo requisição para:', fullUrl);
  }
  
  return fullUrl;
};

// Função helper para fazer fetch com configuração padrão
export const apiFetch = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  const url = apiUrl(endpoint);
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  };

  const isDev = process.env.NODE_ENV !== 'production';
  
  if (isDev) {
    console.log('🚀 Enviando requisição:', {
      url,
      method: options?.method || 'GET',
      environment: process.env.NODE_ENV
    });
  }

  try {
    const response = await fetch(url, defaultOptions);
    
    if (isDev) {
      console.log('📨 Resposta recebida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
    }
    
    // Log de erros mesmo em produção (mas sem detalhes sensíveis)
    if (!response.ok && isDev) {
      const errorText = await response.clone().text();
      console.error('❌ Resposta não OK:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText.substring(0, 200) // Limitar tamanho
      });
    }
    
    return response;
  } catch (error) {
    // Log de erro crítico mesmo em produção
    console.error('❌ Erro na requisição:', {
      url: isDev ? url : '[URL_HIDDEN]',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      environment: process.env.NODE_ENV
    });
    
    throw error;
  }
};

export default API_URL;
