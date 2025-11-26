// Script para testar endpoint específico
import fetch from 'node-fetch';

const tempId = 'e92630bf67834bab59ba26'; // TempId da URL

console.log('🔍 Testando endpoint do usuário temporário...');
console.log('TempId:', tempId);

async function testTempUser() {
  try {
    // Testar localmente primeiro
    console.log('\n📍 Testando LOCAL:');
    const localUrl = `http://localhost:4000/api/users/user/${tempId}`;
    console.log('URL:', localUrl);
    
    const localRes = await fetch(localUrl);
    console.log('Status:', localRes.status);
    
    if (localRes.ok) {
      const localData = await localRes.json();
      console.log('Dados:', localData);
    } else {
      console.log('Erro:', await localRes.text());
    }

    // Testar produção
    console.log('\n📍 Testando PRODUÇÃO:');
    const prodUrl = `https://espacomarias-production.up.railway.app/api/users/user/${tempId}`;
    console.log('URL:', prodUrl);
    
    const prodRes = await fetch(prodUrl);
    console.log('Status:', prodRes.status);
    
    if (prodRes.ok) {
      const prodData = await prodRes.json();
      console.log('Dados:', prodData);
    } else {
      console.log('Erro:', await prodRes.text());
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testTempUser();
