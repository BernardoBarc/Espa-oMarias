// Teste completo do fluxo da aplicação
import fetch from 'node-fetch';

console.log('🔍 TESTE COMPLETO DO SISTEMA');
console.log('================================');

async function testeCompleto() {
  const baseUrl = 'https://espacomarias-production.up.railway.app';
  
  try {
    // 1. Testar se o servidor está online
    console.log('\n📍 1. Testando se servidor está online...');
    const healthRes = await fetch(`${baseUrl}/health`);
    console.log('Health Status:', healthRes.status);
    
    if (healthRes.ok) {
      const healthData = await healthRes.json();
      console.log('Health Data:', healthData);
    }

    // 2. Testar endpoint de verificação de duplicatas
    console.log('\n📍 2. Testando verificação de duplicatas...');
    const checkRes = await fetch(`${baseUrl}/api/users/checkDuplicates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phone: '55996680170', 
        email: 'teste@exemplo.com' 
      })
    });
    console.log('Check Duplicates Status:', checkRes.status);
    
    if (checkRes.ok) {
      const checkData = await checkRes.json();
      console.log('Check Data:', checkData);
    } else {
      const errorText = await checkRes.text();
      console.log('Check Error:', errorText);
    }

    // 3. Testar listar usuários
    console.log('\n📍 3. Testando listar usuários...');
    const usersRes = await fetch(`${baseUrl}/api/users/users`);
    console.log('Users Status:', usersRes.status);
    
    if (usersRes.ok) {
      const usersData = await usersRes.json();
      console.log('Total de usuários:', usersData.length);
      console.log('Primeiros 3 usuários:', usersData.slice(0, 3).map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone
      })));
    } else {
      const errorText = await usersRes.text();
      console.log('Users Error:', errorText);
    }

    // 4. Testar verificação de telefone
    console.log('\n📍 4. Testando verificação de telefone...');
    const phoneRes = await fetch(`${baseUrl}/api/users/startPhoneVerification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phone: '55996680170',
        email: 'teste@exemplo.com'
      })
    });
    console.log('Phone Verification Status:', phoneRes.status);
    
    if (phoneRes.ok) {
      const phoneData = await phoneRes.json();
      console.log('Phone Data:', phoneData);
    } else {
      const errorText = await phoneRes.text();
      console.log('Phone Error:', errorText);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testeCompleto();
