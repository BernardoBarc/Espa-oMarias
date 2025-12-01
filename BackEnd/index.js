import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import router from './routes/router.js';
import db from './database/database.js';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// Importar smsService para inicialização
import './services/smsService.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Configuração CORS para production
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requisições sem origin (ex: aplicativos mobile, Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'https://localhost:3000',
      'https://espacomarias-frontend.vercel.app',
      'https://espacomarias-production.up.railway.app',
    ];
    
    // Permitir qualquer subdomínio do Vercel
    const isVercelDomain = origin.match(/^https:\/\/.*\.vercel\.app$/);
    const isAllowedOrigin = allowedOrigins.includes(origin);
    
    if (isAllowedOrigin || isVercelDomain) {
      console.log('✅ CORS: Origin permitida:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS: Origin rejeitada:', origin);
      console.log('📋 Origins permitidas:', allowedOrigins);
      callback(new Error('Não permitido pelo CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Debug middleware - apenas para desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`🌐 ${new Date().toISOString()} - ${req.method} ${req.path}`);
    console.log('🔍 Origin:', req.headers.origin);
    next();
  });
}

// aumentar limites para permitir imagens em base64 maiores
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Servidor funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// Endpoint para testar conectividade da API
app.get('/api/users/test', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'API /api/users funcionando',
    timestamp: new Date().toISOString(),
    routes: [
      'GET /api/users/users',
      'GET /api/users/dados-salao',
      'GET /api/users/servicos',
      'GET /api/users/agendamentos'
    ]
  });
});

// Debug endpoint para listar todas as rotas registradas
app.get('/api/users/debug-routes', (req, res) => {
  try {
    console.log('🔍 [DEBUG] Listando rotas registradas...');
    
    // Informações básicas do Express
    const routeInfo = {
      status: 'OK',
      message: 'Debug de rotas registradas',
      timestamp: new Date().toISOString(),
      express: {
        version: 'unknown',
        environment: process.env.NODE_ENV || 'development'
      },
      available_routes: [
        'GET /health',
        'GET /api/users/test',
        'GET /api/users/debug-routes',
        'GET /api/users/users',
        'GET /api/users/dados-salao', 
        'GET /api/users/servicos',
        'GET /api/users/agendamentos',
        'POST /api/users/CriarUser',
        'POST /api/users/startPhoneVerification',
        'POST /api/users/confirmPhoneCode'
      ],
      router_loaded: router ? 'YES' : 'NO'
    };
    
    res.status(200).json(routeInfo);
  } catch (error) {
    console.error('❌ [DEBUG] Erro na rota debug:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Erro ao listar rotas',
      error: error.message
    });
  }
});

// SMS test endpoint
app.get('/test-sms-config', (req, res) => {
  console.log('🔍 [TEST] Endpoint de teste SMS chamado');
  
  const config = {
    accountSid: process.env.TWILIO_ACCOUNT_SID ? 'CONFIGURADO' : 'MISSING',
    authToken: process.env.TWILIO_AUTH_TOKEN ? 'CONFIGURADO' : 'MISSING',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || 'MISSING',
    nodeEnv: process.env.NODE_ENV || 'development'
  };
  
  console.log('🔍 [TEST] Configuração atual:', config);
  
  res.json({
    status: 'OK',
    message: 'Teste de configuração SMS',
    config: config,
    timestamp: new Date().toISOString(),
    instructions: {
      trial_account: 'Se estiver usando conta trial do Twilio, apenas números verificados podem receber SMS',
      verify_number: 'Vá em console.twilio.com → Phone Numbers → Manage → Verified Caller IDs',
      alternative: 'Ou use os códigos simulados que aparecem nos logs do Railway'
    }
  });
});

app.use('/api/users', router);

app.use((err, req, res, next) => {
  console.error('❌ Erro no servidor:', err.stack);
  // responder em json se possível
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    res.status(500).json({ error: 'Erro ao acessar o servidor', details: err.message });
  } else {
    res.status(500).send('Erro ao acessar o servidor!');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});