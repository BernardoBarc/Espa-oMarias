import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let client = null;

// Inicializar cliente Twilio apenas se as credenciais existirem
if (accountSid && authToken && twilioPhoneNumber) {
  client = twilio(accountSid, authToken);
  console.log('📱 Twilio configurado com sucesso');
  console.log('📱 Account SID:', accountSid);
  console.log('📱 Phone Number:', twilioPhoneNumber);
} else {
  console.warn('⚠️ Credenciais do Twilio não encontradas:');
  console.warn('  - Account SID:', accountSid ? 'OK' : 'MISSING');
  console.warn('  - Auth Token:', authToken ? 'OK' : 'MISSING');
  console.warn('  - Phone Number:', twilioPhoneNumber ? twilioPhoneNumber : 'MISSING');
  console.warn('⚠️ SMS será simulado.');
}

// Função para enviar SMS
export const sendSMS = async (phoneNumber, message) => {
  console.log('📱 sendSMS chamada com:', { phoneNumber, messageLength: message.length });
  
  try {
    // Se não tem cliente configurado, simular envio
    if (!client) {
      console.log('📱 SMS SIMULADO para', phoneNumber, ':', message);
      console.log('📱 Motivo: Cliente Twilio não configurado');
      return {
        success: true,
        sid: 'simulated_' + Date.now(),
        message: 'SMS simulado com sucesso'
      };
    }

    // Formatar número para padrão internacional (+55)
    const formattedPhone = formatPhoneForTwilio(phoneNumber);
    
    console.log('📱 Enviando SMS real para:', formattedPhone);
    console.log('📱 Número original:', phoneNumber);
    console.log('📱 Número formatado:', formattedPhone);
    console.log('📱 Mensagem:', message);
    console.log('📱 De:', twilioPhoneNumber);
    
    const message_result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedPhone
    });

    console.log('✅ SMS enviado com sucesso:', message_result.sid);
    console.log('✅ Status:', message_result.status);
    
    return {
      success: true,
      sid: message_result.sid,
      message: 'SMS enviado com sucesso'
    };
    
  } catch (error) {
    console.error('❌ Erro ao enviar SMS:', error);
    console.error('❌ Código do erro:', error.code);
    console.error('❌ Mensagem completa:', error.message);
    
    // Em caso de erro, retornar simulação para não quebrar o fluxo
    return {
      success: false,
      error: error.message,
      errorCode: error.code,
      fallback: true,
      message: 'Erro ao enviar SMS. Código gerado para teste: ' + generateVerificationCode()
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
  
  const result = await sendSMS(phoneNumber, message);
  
  return {
    ...result,
    code: code // retornar o código para salvar no banco
  };
};

export default { sendSMS, sendVerificationCode, generateVerificationCode };
