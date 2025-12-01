import express from 'express';
import userService from '../services/userService.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { sendVerificationCode } from '../services/smsService.js';
import { sendEmailVerificationCode, sendPasswordResetCode, sendEmail } from '../services/emailService.js';

const router = express.Router();

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhone(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '');
}

function validateBrazilianPhone(phone) {
  if (!phone) return false;
  
  // Normalizar removendo caracteres não numéricos
  const normalized = String(phone).replace(/\D/g, '');
  
  // Verificar se tem 11 dígitos (DDD + 9 + número)
  if (normalized.length !== 11) {
    return false;
  }
  
  // Verificar se começa com DDD válido (11-99)
  const ddd = normalized.substring(0, 2);
  const validDDDs = [
    '11', '12', '13', '14', '15', '16', '17', '18', '19', // São Paulo
    '21', '22', '24', // Rio de Janeiro
    '27', '28', // Espírito Santo
    '31', '32', '33', '34', '35', '37', '38', // Minas Gerais
    '41', '42', '43', '44', '45', '46', // Paraná
    '47', '48', '49', // Santa Catarina
    '51', '53', '54', '55', // Rio Grande do Sul
    '61', // Distrito Federal
    '62', '64', // Goiás
    '63', // Tocantins
    '65', '66', // Mato Grosso
    '67', // Mato Grosso do Sul
    '68', // Acre
    '69', // Rondônia
    '71', '73', '74', '75', '77', // Bahia
    '79', // Sergipe
    '81', '87', // Pernambuco
    '82', // Alagoas
    '83', // Paraíba
    '84', // Rio Grande do Norte
    '85', '88', // Ceará
    '86', '89', // Piauí
    '91', '93', '94', // Pará
    '92', '97', // Amazonas
    '95', // Roraima
    '96', // Amapá
    '98', '99'  // Maranhão
  ];
  
  if (!validDDDs.includes(ddd)) {
    return false;
  }
  
  // Verificar se o terceiro dígito é 9 (obrigatório para celular)
  if (normalized.charAt(2) !== '9') {
    return false;
  }
  
  // Verificar se o número não é uma sequência repetitiva
  const phoneNumber = normalized.substring(3);
  if (/^(\d)\1{7}$/.test(phoneNumber)) {
    return false;
  }
  
  return true;
}

async function cleanOldTempUsers() {
  try {
    const users = await userService.getAllUsers();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    let cleaned = 0;
    
    for (const user of users) {
      if (user.name === 'temp') {
        const createdAt = user.createdAt ? new Date(user.createdAt) : new Date(0);
        const shouldClean = createdAt < oneDayAgo || 
          (createdAt < oneHourAgo && !user.phoneVerified && !user.emailVerified);
        
        if (shouldClean) {
          await userService.deleteUser(user._id);
          cleaned++;
        }
      }
    }
    
    if (cleaned > 0 && process.env.NODE_ENV !== 'production') {
      console.log(`Limpeza: ${cleaned} registros temporários removidos`);
    }
  } catch (error) {
    console.error('Erro ao limpar registros temporários:', error);
  }
}

// ================================
// ROTAS PRINCIPAIS DE USUÁRIO
// ================================

// Buscar usuário por ID
router.get('/user/:id', async (req, res) => {
  const { id } = req.params;
  
  // Tratar tempIds simulados (quando telefone já existe)
  if (id.startsWith('simulated_')) {
    return res.json({
      _id: id,
      name: 'temp',
      email: 'temp_email@temp.com',
      phone: '',
      phoneVerified: false,
      emailVerified: false,
      message: 'Número já cadastrado - use um número diferente'
    });
  }
  
  try {
    const user = await userService.getUser(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar usuários
router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    const users = await userService.getAllUsers();
    
    if (role) {
      return res.json(users.filter(u => u.role === role));
    }
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar usuário
router.put('/atualizarUser/:id', async (req, res) => {
  const { id } = req.params;
  const userData = req.body || {};
  
  try {
    const existingUser = await userService.getUser(id).catch(() => null);
    if (!existingUser) return res.status(404).json({ error: 'Usuário não encontrado' });

    // Verificar email duplicado
    if (userData.email && String(userData.email).trim() !== String(existingUser.email).trim()) {
      const other = await userService.findByEmail(userData.email).catch(() => null);
      if (other && other._id.toString() !== id) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }
    }

    // Normalizar telefone
    if (userData.phone) {
      userData.phone = normalizePhone(userData.phone);
    }

    const updatedUser = await userService.updateUser(id, userData);
    res.json(updatedUser);
  } catch (error) {
    if (error && error.code === 11000) {
      const key = error.keyValue ? Object.keys(error.keyValue)[0] : null;
      const message = key ? `Valor duplicado para campo '${key}'` : 'Chave duplicada no banco de dados';
      return res.status(400).json({ error: message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Deletar usuário
router.delete('/deletarUser/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await userService.deleteUser(id);
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Compatibilidade: rota plural para buscar usuário por ID
router.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await userService.getUser(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/loginUser', async (req, res) => {
  const { email, password } = req.body;
  try {
    const data = await userService.login(email, password);
    res.json(data);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Alterar senha do usuário logado
router.put('/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'ID do usuário, senha atual e nova senha são obrigatórios' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
    }

    const user = await userService.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Senha atual incorreta' });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ error: 'A nova senha deve ser diferente da senha atual' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await userService.updateUser(userId, { password: hashedNewPassword });

    res.json({ 
      success: true, 
      message: 'Senha alterada com sucesso' 
    });

  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Esqueci minha senha - Enviar código
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email é obrigatório' });

  try {
    const users = await userService.getAllUsers();
    const user = users.find(u => u.email === email && u.name !== 'temp');
    
    if (!user) {
      return res.status(404).json({ error: 'Email não encontrado' });
    }

    const resetCode = generateCode();
    const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    await userService.updateUser(user._id, {
      resetCode: String(resetCode),
      resetCodeExpires: resetExpires
    });

    // Enviar código por email
    const emailResult = await sendPasswordResetCode(email, resetCode);

    // Em produção, enviar email real aqui
    if (process.env.NODE_ENV !== 'production') {
      console.log('Código de recuperação para', email, ':', resetCode);
    }

    const resp = { ok: true, message: 'Código enviado por email' };
    if (process.env.NODE_ENV !== 'production') {
      resp.debugCode = resetCode;
    }

    res.json(resp);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verificar código de recuperação
router.post('/verify-reset-code', async (req, res) => {
  const { email, code } = req.body;
  
  if (!email || !code) return res.status(400).json({ error: 'Email e código são obrigatórios' });

  try {
    const users = await userService.getAllUsers();
    const user = users.find(u => u.email === email && u.name !== 'temp');
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const storedCode = String(user.resetCode || '').trim();
    const receivedCode = String(code || '').trim();
    
    if (!user.resetCode || storedCode !== receivedCode) {
      return res.status(400).json({ error: 'Código inválido' });
    }

    if (user.resetCodeExpires && new Date(user.resetCodeExpires) < new Date()) {
      return res.status(400).json({ error: 'Código expirado. Solicite um novo código.' });
    }

    res.json({ ok: true, message: 'Código válido' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Redefinir senha
router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Email, código e nova senha são obrigatórios' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
  }

  try {
    const users = await userService.getAllUsers();
    const user = users.find(u => u.email === email && u.name !== 'temp');
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const storedCode = String(user.resetCode || '').trim();
    const receivedCode = String(code || '').trim();

    if (!user.resetCode || storedCode !== receivedCode) {
      return res.status(400).json({ error: 'Código inválido' });
    }

    if (user.resetCodeExpires && new Date(user.resetCodeExpires) < new Date()) {
      return res.status(400).json({ error: 'Código expirado. Solicite um novo código.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await userService.updateUser(user._id, {
      password: hashedPassword,
      resetCode: null,
      resetCodeExpires: null
    });

    res.json({ ok: true, message: 'Senha alterada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verificar duplicatas antes de iniciar qualquer processo
router.post('/checkDuplicates', async (req, res) => {
  let { phone, email } = req.body;
  phone = normalizePhone(phone);
  
  try {
    const users = await userService.getAllUsers();
    const duplicates = [];
    
    // Verificar telefone duplicado
    if (phone) {
      const existingUserByPhone = users.find(u => 
        u.name !== 'temp' && u.phone && normalizePhone(u.phone) === phone
      );
      if (existingUserByPhone) {
        duplicates.push('phone');
      }
    }
    
    // Verificar email duplicado
    if (email) {
      const existingUserByEmail = users.find(u => 
        u.name !== 'temp' && u.email === email
      );
      if (existingUserByEmail) {
        duplicates.push('email');
      }
    }
    
    res.json({ duplicates });
  } catch (error) {
    console.error("Error in checkDuplicates:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Iniciar verificação de telefone
router.post('/startPhoneVerification', async (req, res) => {
  let { phone, email, tempId } = req.body;
  phone = normalizePhone(phone);
  
  if (!phone) return res.status(400).json({ error: 'Telefone obrigatório' });
  
  if (!validateBrazilianPhone(phone)) {
    return res.status(400).json({ 
      error: 'Telefone inválido. Digite no formato: DDD + 9 + número (ex: 11987654321)' 
    });
  }
  
  try {
    await cleanOldTempUsers();
    
    // Gerar e enviar código via SMS
    console.log('📱 [PRODUCTION] Iniciando envio SMS para:', phone);
    console.log('📱 [PRODUCTION] Twilio configurado:', {
      accountSid: process.env.TWILIO_ACCOUNT_SID ? 'OK' : 'MISSING',
      authToken: process.env.TWILIO_AUTH_TOKEN ? 'OK' : 'MISSING', 
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    });
    
    const smsResult = await sendVerificationCode(phone);
    console.log('📱 [PRODUCTION] Resultado SMS:', smsResult);
    
    if (!smsResult.success && !smsResult.fallback) {
      return res.status(500).json({ 
        error: 'Erro ao enviar SMS. Tente novamente.' 
      });
    }
    
    const code = smsResult.code;
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    let user = null;
    if (tempId) {
      user = await userService.getUser(tempId).catch(() => null);
      if (!user) return res.status(400).json({ error: 'Registro temporário não encontrado' });
      
      await userService.updateUser(user._id, { 
        phoneCode: code, 
        phoneCodeExpires: expires, 
        phonePending: phone 
      });
      
      // Log do código para desenvolvimento
      if (process.env.NODE_ENV !== 'production' || smsResult.fallback) {
        console.log('📱 Código de verificação de telefone para', phone, ':', code, '(tempId update)');
        console.log('📱 SMS Status:', smsResult.success ? 'Enviado' : 'Simulado');
      }
      
      const resp = { ok: true, tempId: user._id.toString() };
      if (process.env.NODE_ENV !== 'production') resp.debugCode = code;
      return res.json(resp);
    }

    const users = await userService.getAllUsers();
    
    // Verificar se telefone já pertence a usuário definitivo
    const existingUser = users.find(u => u.name !== 'temp' && (
      (u.phone && normalizePhone(u.phone) === phone) || 
      (email && u.email === email)
    ));

    if (existingUser) {
      // Não informar que já existe - apenas simular envio do código
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('📱 Código simulado para telefone já cadastrado:', phone, ':', code);
      return res.json({ ok: true, tempId: 'simulated_' + Date.now().toString() });
    }

    // Procurar registro temporário existente
    const existingTempUser = users.find(u => {
      if (u.name !== 'temp') return false;
      
      const normalizedPhone = normalizePhone(phone);
      const userPhone = normalizePhone(u.phone || '');
      const userPhonePending = normalizePhone(u.phonePending || '');
      
      return userPhone === normalizedPhone || userPhonePending === normalizedPhone;
    });

    if (existingTempUser) {
      await userService.updateUser(existingTempUser._id, { 
        phoneCode: code, 
        phoneCodeExpires: expires, 
        phonePending: phone,
        phoneVerified: false,
        emailVerified: false
      });
      
      // Log do código para desenvolvimento
      if (process.env.NODE_ENV !== 'production' || smsResult.fallback) {
        console.log('📱 Código de verificação de telefone para', phone, ':', code);
        console.log('📱 SMS Status:', smsResult.success ? 'Enviado' : 'Simulado');
      }
      
      const resp = { ok: true, tempId: existingTempUser._id.toString() };
      if (process.env.NODE_ENV !== 'production') resp.debugCode = code;
      return res.json(resp);
    }

    // Criar novo registro temporário
    const tempEmail = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}@temp.local`;
    user = await userService.saveUser({ 
      name: 'temp', 
      phone: '', 
      email: tempEmail, 
      password: crypto.randomBytes(8).toString('hex'),
      createdAt: new Date(),
      phoneVerified: false,
      emailVerified: false
    });
    
    await userService.updateUser(user._id, { 
      phonePending: phone, 
      phoneCode: code, 
      phoneCodeExpires: expires 
    });
    
    // Log do código para desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
      console.log('📱 Código de verificação de telefone para', phone, ':', code, '(novo temp)');
    }
    
    const resp = { ok: true, tempId: user._id.toString() };
    if (process.env.NODE_ENV !== 'production') resp.debugCode = code;
    return res.json(resp);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reenviar código de verificação de telefone
router.post('/resendPhoneCode', async (req, res) => {
  const { tempId } = req.body;
  
  console.log('📱 [PRODUCTION] Reenviando código SMS para tempId:', tempId);
  
  if (!tempId) {
    return res.status(400).json({ error: 'TempId obrigatório' });
  }

  // Detectar tempIds simulados (para usuários já existentes)
  if (tempId.startsWith('simulated_')) {
    console.log('📱 [PRODUCTION] TempId simulado detectado:', tempId);
    return res.json({ ok: true, tempId: tempId });
  }

  try {
    const user = await userService.getUser(tempId).catch(() => null);
    if (!user) {
      return res.status(400).json({ error: 'Registro temporário não encontrado' });
    }

    const phone = user.phonePending || user.phone;
    if (!phone) {
      return res.status(400).json({ error: 'Telefone não encontrado' });
    }

    console.log('📱 [PRODUCTION] Reenviando SMS para:', phone);
    const smsResult = await sendVerificationCode(phone);
    console.log('📱 [PRODUCTION] Resultado reenvio SMS:', smsResult);

    if (!smsResult.success && !smsResult.fallback) {
      return res.status(500).json({ 
        error: 'Erro ao reenviar SMS. Tente novamente.' 
      });
    }

    const code = smsResult.code;
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    await userService.updateUser(user._id, { 
      phoneCode: code, 
      phoneCodeExpires: expires
    });

    // Log do código para desenvolvimento
    if (process.env.NODE_ENV !== 'production' || smsResult.fallback) {
      console.log('📱 [PRODUCTION] Código reenviado para', phone, ':', code);
      console.log('📱 [PRODUCTION] SMS Status:', smsResult.success ? 'Enviado' : 'Simulado');
    }

    const resp = { ok: true, tempId: user._id.toString() };
    if (process.env.NODE_ENV !== 'production') resp.debugCode = code;
    return res.json(resp);

  } catch (error) {
    console.error('❌ [PRODUCTION] Erro ao reenviar código:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Confirmar código de telefone
router.post('/confirmPhoneCode', async (req, res) => {
  let { phone, code, tempId } = req.body;
  code = String(code || '').trim();
  if (!code) return res.status(400).json({ error: 'Code required' });

  try {
    // Detectar tempIds simulados (para usuários já existentes)
    if (tempId && tempId.startsWith('simulated_')) {
      return res.status(400).json({ error: 'Código inválido ou expirado' });
    }

    let user = null;
    if (tempId) {
      user = await userService.getUser(tempId).catch(() => null);
      if (!user) return res.status(400).json({ error: 'Registro temporário não encontrado' });
      
      if (!user.phoneCode || String(user.phoneCode).trim() !== code) {
        return res.status(400).json({ error: 'Código inválido' });
      }
      
      if (user.phoneCodeExpires && new Date(user.phoneCodeExpires) < new Date()) {
        return res.status(400).json({ error: 'Código expirado' });
      }
      
      const applyData = { phoneVerified: true, phoneCode: '', phoneCodeExpires: null };
      if (user.phonePending) {
        applyData.phone = user.phonePending;
        applyData.phonePending = '';
      }
      
      await userService.updateUser(user._id, applyData);
      
      const usersAfter = await userService.getAllUsers();
      const saved = usersAfter.find(u => u._id.toString() === user._id.toString());
      return res.json({ ok: true, user: saved });
    }

    // Fallback para compatibilidade
    phone = normalizePhone(phone);
    if (!phone) return res.status(400).json({ error: 'Phone required' });

    const users = await userService.getAllUsers();
    const candidates = users.filter(u => u.phone && normalizePhone(u.phone) === phone);
    const userByCode = candidates.find(u => u.phoneCode && String(u.phoneCode).trim() === code);
    
    if (!userByCode) {
      return res.status(400).json({ error: 'Código inválido' });
    }
    
    if (userByCode.phoneCodeExpires && new Date(userByCode.phoneCodeExpires) < new Date()) {
      return res.status(400).json({ error: 'Código expirado' });
    }
    
    await userService.updateUser(userByCode._id, { 
      phoneVerified: true, 
      phoneCode: '', 
      phoneCodeExpires: null 
    });
    
    const usersAfter = await userService.getAllUsers();
    const saved = usersAfter.find(u => u._id.toString() === userByCode._id.toString());
    return res.json({ ok: true, user: saved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Iniciar verificação de email
router.post('/startEmailVerification', async (req, res) => {
  let { email, phone, tempId } = req.body;
  phone = normalizePhone(phone);
  if (!email) return res.status(400).json({ error: 'Email obrigatório' });

  // Validação básica de email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }
  
  try {
    await cleanOldTempUsers();
    
    // VERIFICAÇÃO ANTES DO PROCESSO - Checar duplicatas de telefone E email
    const users = await userService.getAllUsers();
    
    // Verificar se telefone já está cadastrado
    if (phone) {
      const existingUserByPhone = users.find(u => 
        u.name !== 'temp' && u.phone && normalizePhone(u.phone) === phone
      );
      if (existingUserByPhone) {
        const simulatedTempId = `simulated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log('📱 Telefone já cadastrado:', phone, '- retornando tempId simulado');
        return res.json({ ok: true, tempId: simulatedTempId });
      }
    }
    
    // Verificar se email já está cadastrado
    const existingUserByEmail = users.find(u => 
      u.name !== 'temp' && u.email === email
    );
    if (existingUserByEmail) {
      const simulatedTempId = `simulated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('📧 Email já cadastrado:', email, '- retornando tempId simulado');
      return res.json({ ok: true, tempId: simulatedTempId });
    }
    
    const code = generateCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    const existingByEmail = await userService.findByEmail(email);
    
    let user = null;
    if (tempId) {
      user = await userService.getUser(tempId).catch(() => null);
    } else {
      user = users.find(u => (u.email && u.email === email) || (u.phone && normalizePhone(u.phone) === phone));
    }

    if (tempId) {
      if (existingByEmail && existingByEmail._id.toString() !== tempId) {
        return res.status(400).json({ error: 'Código inválido ou expirado' });
      }
      
      if (user) {
        await userService.updateUser(user._id, { 
          emailCode: code, 
          emailCodeExpires: expires,
          emailPending: email
        });
        
        // Enviar código por email
        const emailResult = await sendEmailVerificationCode(email);
        
        // Log do código para desenvolvimento
        if (process.env.NODE_ENV !== 'production') {
          console.log('📧 Código de verificação de email para', email, ':', code, '(tempId update)');
        }
        
        const resp = { ok: true, tempId: user._id.toString() };
        if (process.env.NODE_ENV !== 'production') resp.debugCode = code;
        return res.json(resp);
      } else {
        return res.status(400).json({ error: 'Registro temporário inválido. Reinicie o fluxo de verificação.' });
      }
    }
    
    // Procurar registro temporário existente
    const existingTempUser = users.find(u => u.name === 'temp' && (
      u.emailPending === email ||
      (u.email && !u.email.startsWith('temp_') && u.email === email)
    ));

    if (existingTempUser) {
      await userService.updateUser(existingTempUser._id, { 
        emailCode: code, 
        emailCodeExpires: expires, 
        emailPending: email 
      });
      
      // Enviar código por email
      const emailResult = await sendEmailVerificationCode(email);
      
      // Log do código para desenvolvimento
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 Código de verificação de email para', email, ':', code, '(reutilizado)');
      }
      
      const resp = { ok: true, tempId: existingTempUser._id.toString() };
      if (process.env.NODE_ENV !== 'production') resp.debugCode = code;
      return res.json(resp);
    }

    // Criar novo registro temporário
    const temp = await userService.saveUser({ 
      name: 'temp', 
      phone: '', 
      email: `temp_${Date.now()}_${Math.random().toString(36).slice(2)}@temp.local`, 
      password: crypto.randomBytes(8).toString('hex'),
      createdAt: new Date()
    });
    
    await userService.updateUser(temp._id, { 
      emailPending: email, 
      emailCode: code, 
      emailCodeExpires: expires, 
      phonePending: phone || '' 
    });
    
    // Enviar código por email
    const emailResult = await sendEmailVerificationCode(email);
    
    // Log do código para desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
      console.log('📧 Código de verificação de email para', email, ':', code,);
    }
    
    const resp = { ok: true, tempId: temp._id.toString() };
    if (process.env.NODE_ENV !== 'production') resp.debugCode = code;
    return res.json(resp);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Confirmar código de email
router.post('/confirmEmailCode', async (req, res) => {
  const { email, code, tempId } = req.body;
  if (!code) return res.status(400).json({ error: 'Code required' });
  
  try {
    // Detectar tempIds simulados (para usuários já existentes)
    if (tempId && tempId.startsWith('simulated_')) {
      return res.status(400).json({ error: 'Código inválido ou expirado' });
    }

    let user = null;
    if (tempId) {
      user = await userService.getUser(tempId).catch(() => null);
      if (!user) return res.status(400).json({ error: 'Registro temporário não encontrado' });
      
      if (!user.email && !user.emailPending) {
        return res.status(400).json({ error: 'Email não presente no registro' });
      }
      
      if (!user.emailCode || String(user.emailCode).trim() !== String(code).trim()) {
        return res.status(400).json({ error: 'Código inválido' });
      }
      
      if (user.emailCodeExpires && new Date(user.emailCodeExpires) < new Date()) {
        return res.status(400).json({ error: 'Código expirado' });
      }
      
      const applyData = { emailVerified: true, emailCode: '', emailCodeExpires: null };
      if (user.emailPending) {
        applyData.email = user.emailPending;
        applyData.emailPending = '';
      }
      
      await userService.updateUser(user._id, applyData);
      
      const usersAfter = await userService.getAllUsers();
      const saved = usersAfter.find(u => u._id.toString() === user._id.toString());
      return res.json({ ok: true, user: saved });
    }

    // Fallback para compatibilidade
    if (!email || !code) return res.status(400).json({ error: 'Email and code required' });
    
    const userByEmail = await userService.findByEmail(email);
    if (!userByEmail) return res.status(400).json({ error: 'Email não encontrado' });
    if (userByEmail.emailCode !== code) return res.status(400).json({ error: 'Código inválido' });
    
    if (userByEmail.emailCodeExpires && new Date(userByEmail.emailCodeExpires) < new Date()) {
      return res.status(400).json({ error: 'Código expirado' });
    }
    
    await userService.updateUser(userByEmail._id, { 
      emailVerified: true, 
      emailCode: '', 
      emailCodeExpires: null 
    });
    
    const usersAfter = await userService.getAllUsers();
    const saved = usersAfter.find(u => u._id.toString() === userByEmail._id.toString());
    return res.json({ ok: true, user: saved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar usuário (após verificações)
router.post('/CriarUser', async (req, res) => {
  const { name, email, phone, password, tempId } = req.body;
  
  // Validar dados obrigatórios
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }
  
  // Validar formato do telefone
  if (!validateBrazilianPhone(phone)) {
    return res.status(400).json({ 
      error: 'Telefone inválido. Use o formato: DDD + 9 + número (ex: 11987654321)' 
    });
  }
  
  try {
    await cleanOldTempUsers();
    
    const existing = await userService.findByEmail(email);
    if (existing && existing.name !== 'temp') {
      // Não informar que email já existe - simular criação
      console.log('🚫 Tentativa de criar conta com email já existente:', email);
      return res.status(400).json({ error: 'Erro ao processar cadastro. Verifique os dados informados.' });
    }
    
    let temp;
    if (tempId) {
      temp = await userService.getUser(tempId).catch(() => null);
    }
    
    if (!temp) {
      const users = await userService.getAllUsers();
      temp = users.find(u => (u.phone === phone || u.email === email) && (u.name === 'temp' || !u.name));
    }
    
    if (!temp) return res.status(400).json({ error: 'Verifique telefone e email antes de criar conta' });
    if (!temp.phoneVerified) return res.status(400).json({ error: 'Telefone não verificado' });
    if (!temp.emailVerified) return res.status(400).json({ error: 'Email não verificado' });
    
    const hashed = await bcrypt.hash(password, 10);
    const updated = await userService.updateUser(temp._id, { 
      name, 
      email, 
      phone, 
      password: hashed, 
      role: 'client' 
    });
    
    // Limpar registros temporários duplicados
    try {
      const users = await userService.getAllUsers();
      const duplicateTemps = users.filter(u => 
        u.name === 'temp' && 
        u._id.toString() !== temp._id.toString() && 
        (
          (u.emailPending === email) ||
          (u.phonePending && normalizePhone(u.phonePending) === normalizePhone(phone)) ||
          (u.email && !u.email.startsWith('temp_') && u.email === email) ||
          (u.phone && normalizePhone(u.phone) === normalizePhone(phone))
        )
      );
      
      for (const duplicateTemp of duplicateTemps) {
        await userService.deleteUser(duplicateTemp._id);
      }
    } catch (cleanupError) {
      // Não falhar a criação por causa da limpeza
    }
    
    res.status(201).json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar usuário administrativamente (manicures, etc.)
router.post('/admin/createUser', async (req, res) => {
  const { name, email, phone, password, role = 'manicure' } = req.body;
  
  try {
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'nome, email e senha são obrigatórios' });
    }
    
    const existing = await userService.findByEmail(email);
    if (existing) {
      console.log('🚫 Tentativa de registro direto com email já existente:', email);
      return res.status(400).json({ error: 'Erro ao processar cadastro. Verifique os dados informados.' });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    const newUser = await userService.saveUser({ 
      name, 
      email, 
      phone: normalizePhone(phone), 
      password: hashed, 
      role 
    });
    
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================================
// FORMULÁRIO DE CONTATO
// ================================

// Endpoint para envio de formulário de contato
router.post('/send-contact-email', async (req, res) => {
  const { nome, email, assunto, mensagem } = req.body;
  
  // Validações básicas
  if (!nome || !email || !assunto || !mensagem) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }
  
  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }
  
  try {
    // Buscar dados do salão para obter o email de destino
    const dadosSalaoService = (await import('../services/dadosSalaoService.js')).default;
    
    let emailDestino = null;
    
    try {
      const todosDados = await dadosSalaoService.getAllDadosSalao();
      const dados = todosDados && todosDados.length > 0 ? todosDados[0] : null;
      emailDestino = dados?.email;
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Erro ao buscar dados do salão:', e.message);
      }
    }
    
    if (!emailDestino) {
      return res.status(500).json({ error: 'Email do salão não configurado. Entre em contato pelo telefone.' });
    }
    
    // Verificar se as variáveis de email estão configuradas
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      // Em desenvolvimento, simular envio de email
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 SIMULAÇÃO DE ENVIO DE EMAIL:');
        console.log('================================');
        console.log(`Para: ${emailDestino}`);
        console.log(`De: ${email} (${nome})`);
        console.log(`Assunto: [CONTATO SITE] ${assunto}`);
        console.log('Mensagem:', mensagem);
        console.log('================================');
      }
      
      return res.json({ 
        ok: true, 
        message: 'Mensagem enviada com sucesso! Entraremos em contato em breve.',
        debug: process.env.NODE_ENV !== 'production' ? {
          emailDestino,
          simulacao: true,
          motivo: 'Variáveis EMAIL_USER/EMAIL_PASS não configuradas'
        } : undefined
      });
    }
    
    // Verificar se as credenciais de email estão configuradas
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || 
        process.env.EMAIL_USER === 'seuemail@gmail.com' || 
        process.env.EMAIL_PASS === 'sua_senha_de_app') {
      
      console.log('📧 Simulando envio de email (credenciais não configuradas):');
      console.log(`De: ${nome} (${email})`);
      console.log(`Assunto: [CONTATO SITE] ${assunto}`);
      console.log(`Mensagem: ${mensagem}`);
      
      return res.json({
        ok: true,
        message: 'Mensagem enviada com sucesso! Entraremos em contato em breve.',
        debug: process.env.NODE_ENV !== 'production' ? {
          simulacao: true,
          motivo: 'Credenciais de email não configuradas'
        } : undefined
      });
    }
    
    // Configurar transporter do nodemailer
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Espaço Marias'}" <${process.env.EMAIL_USER}>`,
      to: emailDestino,
      replyTo: email,
      subject: `[CONTATO SITE] ${assunto}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Nova mensagem do site</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
            <p><strong>Nome:</strong> ${nome}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Assunto:</strong> ${assunto}</p>
            <p><strong>Mensagem:</strong></p>
            <div style="background: white; padding: 15px; border-left: 4px solid #333; margin-top: 10px;">
              ${mensagem.replace(/\n/g, '<br>')}
            </div>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Esta mensagem foi enviada através do formulário de contato do site.
          </p>
        </div>
      `
    };

    // Enviar email usando o emailService
    const resultado = await sendEmail(emailDestino, `[CONTATO SITE] ${assunto}`, `Nome: ${nome}\nEmail: ${email}\nMensagem: ${mensagem}`);
    
    res.json({
      ok: true,
      message: 'Mensagem enviada com sucesso! Entraremos em contato em breve.'
    });
    
  } catch (error) {
    console.error('Erro ao enviar email de contato:', error);
    
    // Fallback para simulação em caso de qualquer erro de email
    console.log('📧 Simulando envio de email (erro no servidor de email):');
    console.log(`De: ${nome} (${email})`);
    console.log(`Assunto: [CONTATO SITE] ${assunto}`);
    console.log(`Mensagem: ${mensagem}`);
    
    return res.json({
      ok: true,
      message: 'Mensagem recebida! Entraremos em contato em breve.',
      debug: process.env.NODE_ENV !== 'production' ? {
        simulacao: true,
        motivo: 'Erro no servidor de email',
        erro: error.message
      } : undefined
    });
    
    res.status(500).json({ error: 'Erro interno do servidor. Tente novamente.' });
  }
});

export default router;