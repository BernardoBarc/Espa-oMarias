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

console.log('🔍 [STARTUP] Verificando variáveis Twilio no startup:');
console.log('🔍 [STARTUP] TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'CONFIGURADO' : 'MISSING');
console.log('🔍 [STARTUP] TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'CONFIGURADO' : 'MISSING'); 
console.log('🔍 [STARTUP] TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER || 'MISSING');

const app = express();
const PORT = process.env.PORT || 4000;

// Configuração CORS para production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL,
        'https://your-frontend-domain.vercel.app', // Substitua pela URL do seu frontend no Vercel
        'https://localhost:3000',
        'http://localhost:3000'
      ]
    : ['http://localhost:3000', 'https://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// aumentar limites para permitir imagens em base64 maiores
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Servidor funcionando',
    timestamp: new Date().toISOString()
  });
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
    timestamp: new Date().toISOString()
  });
});

app.use('/', router);

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