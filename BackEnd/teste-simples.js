// Teste básico sem dependências externas
console.log('🔍 TESTE BÁSICO DO SISTEMA');
console.log('================================');

// Simular teste com JavaScript nativo
const testeBasico = `
// Cole este código no console do navegador (F12 > Console):

console.log('🔍 TESTE COMPLETO DO SISTEMA');

// 1. Testar Health
fetch('https://espacomarias-production.up.railway.app/health')
  .then(res => {
    console.log('✅ Health Status:', res.status);
    return res.json();
  })
  .then(data => console.log('Health Data:', data))
  .catch(err => console.log('❌ Health Error:', err));

// 2. Testar listar usuários  
fetch('https://espacomarias-production.up.railway.app/api/users/users')
  .then(res => {
    console.log('✅ Users Status:', res.status);
    return res.json();
  })
  .then(data => {
    console.log('Total usuários:', data.length);
    console.log('Usuários:', data.slice(0, 3));
  })
  .catch(err => console.log('❌ Users Error:', err));

// 3. Testar verificação de duplicatas
fetch('https://espacomarias-production.up.railway.app/api/users/checkDuplicates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '55996680170', email: 'teste@exemplo.com' })
})
  .then(res => {
    console.log('✅ Check Status:', res.status);
    return res.json();
  })
  .then(data => console.log('Check Data:', data))
  .catch(err => console.log('❌ Check Error:', err));
`;

console.log(testeBasico);
