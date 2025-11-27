// Configuração da URL da API
// Automaticamente detecta se está em desenvolvimento ou produção

const getApiUrl = (): string => {
  // Em produção (Vercel), usar a variável de ambiente
  if (process.env.NODE_ENV === 'production') {
    const prodUrl = process.env.NEXT_PUBLIC_API_URL || 'https://espacomarias-production.up.railway.app';
    console.log('🌐 Modo PRODUÇÃO - API URL:', prodUrl);
    console.log('🔧 Environment variables:', {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      all_env: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_'))
    });
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
  console.log('📡 Fazendo requisição para:', fullUrl);
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

  console.log('🚀 Enviando requisição:', {
    url,
    method: options?.method || 'GET',
    headers: defaultOptions.headers,
    environment: process.env.NODE_ENV
  });

  try {
    const response = await fetch(url, defaultOptions);
    console.log('📨 Resposta recebida:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    // Se não for OK, log do erro
    if (!response.ok) {
      const errorText = await response.clone().text();
      console.error('❌ Resposta não OK:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
    }
    
    return response;
  } catch (error) {
    console.error('❌ Erro na requisição:', {
      url,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
      environment: process.env.NODE_ENV
    });
    
    // Tentar identificar o tipo de erro
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('🚨 Possível problema de CORS ou conectividade de rede');
    }
    
    throw error;
  }
};

export default API_URL;
