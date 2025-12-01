import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let client = null;

// Inicializar cliente Twilio apenas se as credenciais existirem
if (accountSid && authToken && twilioPhoneNumber) {
  client = twilio(accountSid, authToken);
  if (process.env.NODE_ENV !== 'production') {
    console.log('📱 Twilio configurado com sucesso');
  }
} else {
  console.log('⚠️ Twilio não configurado - SMS será simulado');
}

// Função para enviar SMS
export const sendSMS = async (phoneNumber, message) => {
  console.log('📱 [PRODUCTION] sendSMS chamada com:', { phoneNumber, messageLength: message.length });
  
  try {
    // Se não tem cliente configurado, simular envio
    if (!client) {
      console.log('📱 [PRODUCTION] SMS SIMULADO para', phoneNumber, ':', message);
      console.log('📱 [PRODUCTION] Motivo: Cliente Twilio não configurado');
      return {
        success: true,
        sid: 'simulated_' + Date.now(),
        message: 'SMS simulado com sucesso'
      };
    }

    // Formatar número para padrão internacional (+55)
    const formattedPhone = formatPhoneForTwilio(phoneNumber);
    
    console.log('📱 [PRODUCTION] Enviando SMS real para:', formattedPhone);
    console.log('📱 [PRODUCTION] Número original:', phoneNumber);
    console.log('📱 [PRODUCTION] Número formatado:', formattedPhone);
    console.log('📱 [PRODUCTION] Mensagem:', message);
    console.log('📱 [PRODUCTION] De:', twilioPhoneNumber);
    
    const message_result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedPhone
    });

    console.log('✅ [PRODUCTION] SMS enviado com sucesso:', message_result.sid);
    console.log('✅ [PRODUCTION] Status:', message_result.status);
    
    return {
      success: true,
      sid: message_result.sid,
      message: 'SMS enviado com sucesso'
    };
    
  } catch (error) {
    console.error('❌ [PRODUCTION] Erro ao enviar SMS:', error);
    console.error('❌ [PRODUCTION] Código do erro:', error.code);
    console.error('❌ [PRODUCTION] Mensagem completa:', error.message);
    
    // Se o erro for de número não verificado (conta trial), simular envio
    if (error.code === 21608 || error.message.includes('unverified')) {
      console.log('📱 [PRODUCTION] CONTA TRIAL DETECTADA - Simulando envio de SMS');
      console.log('📱 [PRODUCTION] Para resolver: Verifique o número no Twilio Console ou upgrade para conta paga');
      const code = generateVerificationCode();
      console.log('📱 [PRODUCTION] CÓDIGO DE VERIFICAÇÃO SIMULADO:', code);
      console.log('📱 [PRODUCTION] Use este código para testar:', code);
      
      return {
        success: true,
        sid: 'trial_simulated_' + Date.now(),
        message: 'SMS simulado - conta trial. Código: ' + code,
        code: code,
        isTrial: true
      };
    }
    
    // Para outros erros, também retornar simulação
    const fallbackCode = generateVerificationCode();
    console.log('📱 [PRODUCTION] CÓDIGO FALLBACK:', fallbackCode);
    
    return {
      success: false,
      error: error.message,
      errorCode: error.code,
      fallback: true,
      code: fallbackCode,
      message: 'Erro ao enviar SMS. Código gerado para teste: ' + fallbackCode
    };
  }
};

// Função para formatar telefone brasileiro para Twilio (+55)
const formatPhoneForTwilio = (phone) => {
  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Se já tem código do país, retorna
  if (cleanPhone.startsWith('55') && cleanPhone.length === 13) {
    return '+' + cleanPhone;
  }
  
  // Se é número brasileiro (11 dígitos), adiciona +55
  if (cleanPhone.length === 11) {
    return '+55' + cleanPhone;
  }
  
  // Se tem 10 dígitos (sem o 9), adiciona 9 e +55
  if (cleanPhone.length === 10) {
    const ddd = cleanPhone.substring(0, 2);
    const number = cleanPhone.substring(2);
    return '+55' + ddd + '9' + number;
  }
  
  throw new Error('Número de telefone inválido: ' + phone);
};

// Gerar código de verificação
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Função para enviar código de verificação
export const sendVerificationCode = async (phoneNumber) => {
  const code = generateVerificationCode();
  const message = `🔐 Espaço Marias - Seu código de verificação é: ${code}. Válido por 10 minutos.`;
  
  console.log('📱 Código de verificação de telefone para', phoneNumber, ':', code);
  
  const result = await sendSMS(phoneNumber, message);
  
  // Se retornou código do sistema de fallback/trial, usar esse código
  const finalCode = result.code || code;
  
  console.log('📱 SMS Status:', result.success ? 'Enviado' : 'Simulado');
  
  return {
    ...result,
    code: finalCode // retornar o código para salvar no banco
  };
};

export default { sendSMS, sendVerificationCode, generateVerificationCode };
