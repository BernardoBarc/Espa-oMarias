// Configuração da URL da API
// Automaticamente detecta se está em desenvolvimento ou produção

const getApiUrl = (): string => {
  // Em produção (Vercel), usar a variável de ambiente
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_API_URL || 'https://espacomarias-production.up.railway.app';
  }
  
  // Em desenvolvimento, usar localhost
  return 'http://localhost:4000';
};

export const API_URL = getApiUrl();

// Helper function para fazer fetch com a URL correta
export const apiUrl = (endpoint: string): string => {
  // Remove a barra inicial se existir
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_URL}/${cleanEndpoint}`;
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

  return fetch(url, defaultOptions);
};

export default API_URL;
