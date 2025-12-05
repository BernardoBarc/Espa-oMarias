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
  user: emailConfig.user ? 'Configurado' : 'Faltando',
  pass: emailConfig.pass ? 'Configurado' : 'Faltando',
  from: emailConfig.from ? 'Configurado' : 'Faltando',
  sendgridApiKey: emailConfig.sendgridApiKey ? 'Configurado' : 'Faltando'
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
  // Configuração Gmail
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailConfig.user,
      pass: emailConfig.pass
    },
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
    secure: true,
    tls: {
      rejectUnauthorized: false
    }
  });
  console.log('✅ Gmail configurado com sucesso');
} else {
  console.log('⚠️  Email não configurado - Modo simulação ativado');
  console.log('   Para usar email real, configure:');
  console.log('   - EMAIL_SERVICE: "gmail"');
  console.log('   - EMAIL_USER: seu email Gmail');
  console.log('   - EMAIL_PASS: senha de app do Gmail');
  console.log('   - EMAIL_FROM: email do remetente');
}

// Função para enviar email
export const sendEmail = async (to, subject, text, html = null) => {
  try {
    // Se não tem transporter configurado, simular envio
    if (!transporter) {
      console.log('📧 [SIMULAÇÃO] Enviando email para:', to);
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
      html: html || text,
      replyTo: emailConfig.from
    };

    console.log(`📤 Enviando email para: ${to}`);
    console.log(`📝 Assunto: ${subject}`);
    
    const result = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email enviado com sucesso! Message ID: ${result.messageId}`);
    console.log(`✅ Resposta do servidor: ${result.response}`);

    return {
      success: true,
      messageId: result.messageId,
      message: 'Email enviado com sucesso'
    };

  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.message);
    console.error('❌ Detalhes do erro:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    // Tentar novamente se for um erro temporário
    if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.log('🔄 Tentando reconexão...');
      return {
        success: false,
        error: 'Erro de conexão. Tente novamente.',
        retry: true
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

  // Adicionar código ao resultado
  return {
    ...result,
    code: code
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

  return result;
};

// Função para enviar notificação de agendamento
export const sendAppointmentNotification = async (email, appointmentDetails) => {
  const subject = '📅 Espaço Marias - Confirmação de Agendamento';
  const text = `Olá! Seu agendamento foi confirmado para ${appointmentDetails.date} às ${appointmentDetails.time}.`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #D63384; margin: 0;">Espaço Marias</h1>
        <p style="color: #6c757d; margin: 5px 0;">Seu salão de beleza</p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
        <h2 style="color: #495057; margin-bottom: 20px; text-align: center;">Agendamento Confirmado</h2>
        
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #dee2e6;">
          <h3 style="color: #D63384; margin-top: 0;">Detalhes do Agendamento</h3>
          <p><strong>Data:</strong> ${appointmentDetails.date}</p>
          <p><strong>Horário:</strong> ${appointmentDetails.time}</p>
          <p><strong>Serviço:</strong> ${appointmentDetails.service}</p>
          <p><strong>Profissional:</strong> ${appointmentDetails.professional}</p>
          ${appointmentDetails.notes ? `<p><strong>Observações:</strong> ${appointmentDetails.notes}</p>` : ''}
        </div>
        
        <p style="color: #6c757d; text-align: center;">
          Chegue 10 minutos antes do horário marcado.<br>
          Em caso de cancelamento, avise com 24h de antecedência.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
        <p style="color: #6c757d; font-size: 12px;">
          Para cancelar ou reagendar, entre em contato conosco.
        </p>
      </div>
    </div>
  `;

  console.log(`📅 Enviando confirmação de agendamento para ${email}`);

  const result = await sendEmail(email, subject, text, html);

  return result;
};

// Exportar funções
export default { 
  sendEmail, 
  sendEmailVerificationCode, 
  sendPasswordResetCode,
  sendAppointmentNotification,
  generateEmailCode 
};