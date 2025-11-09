import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import router from './routes/router.js';
import db from './database/database.js';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
console.log("JWT_SECRET:", process.env.JWT_SECRET);

const app = express();

app.use(cors());
// aumentar limites para permitir imagens em base64 maiores
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));

app.use('/', router);

app.use((err, req, res, next) => {
  console.error(err.stack);
  // responder em json se possível
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    res.status(500).json({ error: 'Erro ao acessar o servidor', details: err.message });
  } else {
    res.status(500).send('Erro ao acessar o servidor!');
  }
});

app.listen(4000, () => {
  console.log('Servidor rodando na porta 4000');
});