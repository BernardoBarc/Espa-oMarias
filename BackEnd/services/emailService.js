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

console.log('📧 Config debug:', {
  service: emailConfig.service,
  user: emailConfig.user ? 'CONFIGURADO' : 'FALTANDO',
  pass: emailConfig.pass ? 'CONFIGURADO' : 'FALTANDO',
  from: emailConfig.from ? 'CONFIGURADO' : 'FALTANDO',
  sendgridApiKey: emailConfig.sendgridApiKey ? 'CONFIGURADO' : 'FALTANDO'
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

  console.log('✅ SendGrid email service configurado com sucesso');
} else if (emailConfig.user && emailConfig.pass && emailConfig.from) {
  // Configuração Gmail (fallback)
  transporter = nodemailer.createTransport({
    service: emailConfig.service,
    auth: {
      user: emailConfig.user,
      pass: emailConfig.pass
    },
    connectionTimeout: 60000, // 60 segundos
    greetingTimeout: 30000,   // 30 segundos
    socketTimeout: 60000      // 60 segundos
  });

  console.log('✅ Gmail email service configurado com sucesso');
} else {
  console.log('❌ Email service não configurado - emails serão simulados');
}

// Função para enviar email
export const sendEmail = async (to, subject, text, html = null) => {
  try {
    // Se não tem transporter configurado, simular envio
    if (!transporter) {
      return {
        success: true,
        messageId: 'simulated_' + Date.now(),
        message: 'Email simulado com sucesso',
        simulated: true
      };
    }

    const mailOptions = {
      from: `"Espaço Marias" <${emailConfig.from}>`,
      to: to,
      subject: subject,
      text: text,
      html: html || text
    };

    const result = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: result.messageId,
      message: 'Email enviado com sucesso'
    };

  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.message);
    console.error('❌ Erro detalhado:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    return {
      success: false,
      error: error.message,
      errorCode: error.code,
      fallback: true,
      message: 'Erro ao enviar email. Usando simulação'
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

  console.log('📧 Código de verificação de email para', email, ':', code);

  const result = await sendEmail(email, subject, text, html);

  // Se retornou código do sistema de fallback, usar esse código
  const finalCode = result.code || code;

  console.log('📧 Email Status:', result.success ? 'Enviado' : 'Simulado');

  return {
    ...result,
    code: finalCode // retornar o código para salvar no banco
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

  console.log('🔐 Código de recuperação de senha para', email, ':', code);

  const result = await sendEmail(email, subject, text, html);

  console.log('📧 Email Status:', result.success ? 'Enviado' : 'Simulado');

  return result;
};

export default { 
  sendEmail, 
  sendEmailVerificationCode, 
  sendPasswordResetCode,
  generateEmailCode 
};
