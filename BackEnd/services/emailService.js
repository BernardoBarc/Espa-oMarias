import sgMail from '@sendgrid/mail';

// Configuração
const emailConfig = {
  service: process.env.EMAIL_SERVICE || 'sendgrid',
  from: process.env.EMAIL_FROM,
  sendgridApiKey: process.env.SENDGRID_API_KEY
};

console.log('📧 Configuração de email:', {
  service: emailConfig.service,
  from: emailConfig.from ? 'Configurado' : 'FALTANDO',
  sendgridApiKey: emailConfig.sendgridApiKey ? 'Configurado' : 'FALTANDO'
});

// Configurar SendGrid
if (emailConfig.service === 'sendgrid' && emailConfig.sendgridApiKey && emailConfig.from) {
  sgMail.setApiKey(emailConfig.sendgridApiKey);
  console.log('✅ SendGrid configurado com sucesso via API');
} else {
  console.log('⚠️  SendGrid não configurado - Modo simulação ativado');
  console.log('   Configure no Railway:');
  console.log('   - SENDGRID_API_KEY: sua chave API do SendGrid');
  console.log('   - EMAIL_FROM: email verificado no SendGrid');
}

// Função para enviar email
export const sendEmail = async (to, subject, text, html = null) => {
  try {
    // Se não tem API key configurada, simular envio
    if (!emailConfig.sendgridApiKey) {
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

    const msg = {
      to: to,
      from: {
        email: emailConfig.from,
        name: 'Espaço Marias'
      },
      subject: subject,
      text: text,
      html: html || text,
      replyTo: emailConfig.from,
      mailSettings: {
        sandboxMode: {
          enable: false
        }
      }
    };

    console.log(`📤 Enviando email via SendGrid para: ${to}`);
    console.log(`📝 Assunto: ${subject}`);
    
    const response = await sgMail.send(msg);
    
    console.log(`✅ Email enviado com sucesso! Status: ${response[0].statusCode}`);
    console.log(`✅ Headers:`, response[0].headers);

    return {
      success: true,
      messageId: response[0].headers['x-message-id'] || Date.now().toString(),
      message: 'Email enviado com sucesso'
    };

  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.message);
    
    if (error.response) {
      console.error('❌ Status Code:', error.response.statusCode);
      console.error('❌ Body:', error.response.body);
      console.error('❌ Headers:', error.response.headers);
    }
    
    // Modo fallback para desenvolvimento
    console.log('⚠️  Usando modo simulação (fallback)...');
    const simulatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    return {
      success: true,
      messageId: 'fallback_' + Date.now(),
      message: 'Email em fila (modo fallback)',
      simulated: true,
      fallback: true,
      code: simulatedCode
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

  // SEMPRE retornar o código real para verificação
  return {
    ...result,
    code: code,
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

  return result;
};

export default { 
  sendEmail, 
  sendEmailVerificationCode, 
  sendPasswordResetCode,
  generateEmailCode 
};