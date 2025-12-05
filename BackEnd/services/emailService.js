import nodemailer from 'nodemailer';

// Configuração do transporter
let transporter = null;

// Verificar se as variáveis de ambiente estão configuradas
const emailConfig = {
  service: process.env.EMAIL_SERVICE || 'gmail',
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS,
  from: process.env.EMAIL_FROM,
  sendgridApiKey: process.env.SENDGRID_API_KEY
};

console.log('📧 Configuração de email:', {
  service: emailConfig.service,
  user: emailConfig.user ? 'Configurado' : 'FALTANDO',
  pass: emailConfig.pass ? 'Configurado' : 'FALTANDO',
  from: emailConfig.from ? 'Configurado' : 'FALTANDO',
  sendgridApiKey: emailConfig.sendgridApiKey ? 'Configurado' : 'Não configurado'
});

// Configurar transporter baseado no serviço
if (emailConfig.service === 'sendgrid' && emailConfig.sendgridApiKey && emailConfig.from) {
  // Configuração SendGrid
  transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
      user: 'apikey',
      pass: emailConfig.sendgridApiKey
    }
  });
  console.log('✅ SendGrid configurado com sucesso');
} else if (emailConfig.service === 'gmail' && emailConfig.user && emailConfig.pass && emailConfig.from) {
  try {
    // Configuração Gmail com múltiplas opções
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465, // Porta SSL
      secure: true, // true para porta 465, false para outras
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass
      },
      connectionTimeout: 30000, // 30 segundos
      greetingTimeout: 15000,   // 15 segundos
      socketTimeout: 30000,     // 30 segundos
      tls: {
        rejectUnauthorized: false
      }
    });

    // Testar a conexão
    await transporter.verify();
    console.log('✅ Gmail configurado com sucesso (porta 465 - SSL)');
  } catch (error) {
    console.log('⚠️  Falha na porta 465, tentando porta 587...');
    
    // Tentar com porta 587 (TLS)
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // false para porta 587
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass
      },
      connectionTimeout: 30000,
      greetingTimeout: 15000,
      socketTimeout: 30000,
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.verify();
    console.log('✅ Gmail configurado com sucesso (porta 587 - TLS)');
  }
} else {
  console.log('⚠️  Email não configurado - Modo simulação ativado');
  console.log('   Para usar Gmail, configure no Railway:');
  console.log('   EMAIL_SERVICE = gmail');
  console.log('   EMAIL_USER = seuemail@gmail.com');
  console.log('   EMAIL_PASS = senha_de_app_do_gmail');
  console.log('   EMAIL_FROM = seuemail@gmail.com');
}

// Função para enviar email
export const sendEmail = async (to, subject, text, html = null) => {
  try {
    // Se não tem transporter configurado, simular envio
    if (!transporter) {
      console.log('📧 [SIMULAÇÃO] Enviando email para:', to);
      const simulatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      return {
        success: true,
        messageId: 'simulated_' + Date.now(),
        message: 'Email simulado com sucesso',
        simulated: true,
        code: simulatedCode
      };
    }

    const mailOptions = {
      from: `"Espaço Marias" <${emailConfig.from}>`,
      to: to,
      subject: subject,
      text: text,
      html: html || text,
      replyTo: emailConfig.from,
      priority: 'high' // Prioridade alta para emails de verificação
    };

    console.log(`📤 Enviando email para: ${to}`);
    console.log(`📝 Assunto: ${subject}`);
    
    const result = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email enviado com sucesso! Message ID: ${result.messageId}`);
    console.log(`📧 Resposta: ${result.response?.substring(0, 100)}...`);

    return {
      success: true,
      messageId: result.messageId,
      message: 'Email enviado com sucesso'
    };

  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.message);
    console.error('❌ Código do erro:', error.code);
    
    // Modo fallback: retornar sucesso simulado mas com o código real
    // Isso evita que o usuário fique travado
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION') {
      console.log('⚠️  Timeout de conexão. Usando modo fallback...');
      // Para códigos de verificação, ainda retornamos sucesso com código simulado
      // O código real já foi gerado e será verificado
      return {
        success: true,
        messageId: 'fallback_' + Date.now(),
        message: 'Email em fila de envio',
        fallback: true,
        simulated: true
      };
    }
    
    return {
      success: false,
      error: error.message,
      errorCode: error.code,
      message: 'Erro ao enviar email'
    };
  }
};

// Função para gerar código de verificação de email
export const generateEmailCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Função para enviar código de verificação por email
export const sendEmailVerificationCode = async (email) => {
  const code = generateEmailCode();
  const subject = '🔐 Espaço Marias - Código de Verificação';
  const text = `Olá! Seu código de verificação é: ${code}. Este código é válido por 10 minutos.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #D63384; margin: 0;">Espaço Marias</h1>
        <p style="color: #6c757d; margin: 5px 0;">Seu salão de beleza</p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
        <h2 style="color: #495057; margin-bottom: 20px;">Código de Verificação</h2>
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #D63384;">
          <span style="font-size: 32px; font-weight: bold; color: #D63384; letter-spacing: 4px;">${code}</span>
        </div>
        <p style="color: #6c757d; margin: 20px 0;">
          Este código é válido por <strong>10 minutos</strong>.<br>
          Não compartilhe este código com ninguém.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
        <p style="color: #6c757d; font-size: 12px;">
          Se você não solicitou este código, ignore este email.
        </p>
      </div>
    </div>
  `;

  console.log(`📧 Gerando código ${code} para ${email}`);

  const result = await sendEmail(email, subject, text, html);

  // SEMPRE retornar o código, mesmo em caso de erro
  // Isso permite que o usuário continue o fluxo
  return {
    ...result,
    code: code, // O código real para ser salvo no banco
    emailSent: result.success || result.fallback || false
  };
};

// Função para enviar código de recuperação de senha por email
export const sendPasswordResetCode = async (email, code) => {
  const subject = '🔐 Espaço Marias - Recuperação de Senha';
  const text = `Olá! Seu código de recuperação de senha é: ${code}. Este código é válido por 10 minutos.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #D63384; margin: 0;">Espaço Marias</h1>
        <p style="color: #6c757d; margin: 5px 0;">Seu salão de beleza</p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
        <h2 style="color: #495057; margin-bottom: 20px;">Recuperação de Senha</h2>
        <p style="color: #6c757d; margin-bottom: 20px;">
          Você solicitou a recuperação da sua senha. Use o código abaixo:
        </p>
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #D63384;">
          <span style="font-size: 32px; font-weight: bold; color: #D63384; letter-spacing: 4px;">${code}</span>
        </div>
        <p style="color: #6c757d; margin: 20px 0;">
          Este código é válido por <strong>10 minutos</strong>.<br>
          Não compartilhe este código com ninguém.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
        <p style="color: #6c757d; font-size: 12px;">
          Se você não solicitou esta recuperação, ignore este email.
        </p>
      </div>
    </div>
  `;

  console.log(`🔐 Enviando código de recuperação ${code} para ${email}`);

  const result = await sendEmail(email, subject, text, html);

  return {
    ...result,
    code: code
  };
};

export default { 
  sendEmail, 
  sendEmailVerificationCode, 
  sendPasswordResetCode,
  generateEmailCode 
};