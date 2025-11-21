import express from 'express';
import agendamentoService from '../services/agendamentoService.js';
import { authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/agendamentos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const agendamento = await agendamentoService.getAgendamento(id);
    res.json(agendamento);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/agendamentos', async (req, res) => {
  try {
    const agendamentos = await agendamentoService.getAllAgendamentos();
    res.send(agendamentos);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

router.post('/criarAgendamentos', async (req, res) => {
  const { serviceId, tempoAproximado, dataAgendamento, clientId, manicureId, status, adicionais } = req.body;
  authorizeRoles(['admin', 'manicure']);
  try {
    const Agendamento = await agendamentoService.saveAgendamento({ serviceId, tempoAproximado, dataAgendamento, clientId, manicureId, status, adicionais });
    res.send(Agendamento);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

router.put('/atualizarAgendamentos/:id', async (req, res) => {
  const { id } = req.params;
  const agendamentoData = req.body;
  authorizeRoles(['admin', 'manicure']);
  try {
    // VERIFICAR SE O AGENDAMENTO AINDA EXISTE E TEM O STATUS ESPERADO
    const agendamentoAtual = await agendamentoService.getAgendamento(id);
    
    if (!agendamentoAtual) {
      return res.status(404).json({ 
        error: 'Agendamento não encontrado',
        code: 'AGENDAMENTO_NAO_ENCONTRADO'
      });
    }
    
    // CONFLITO APENAS: Quando agendamento era PENDENTE e foi alterado simultaneamente
    
    // ÚNICO CONFLITO: Manicure tentando confirmar agendamento que saiu de PENDENTE para CANCELADO
    if (agendamentoData.status === 'confirmado' && agendamentoAtual.status === 'cancelado') {
      return res.status(409).json({ 
        error: 'Este agendamento já foi cancelado pelo cliente',
        code: 'AGENDAMENTO_JA_CANCELADO',
        currentStatus: agendamentoAtual.status
      });
    }
    
    // TODAS AS OUTRAS OPERAÇÕES SÃO PERMITIDAS:
    // ✅ Cliente cancelar agendamento CONFIRMADO (sem erro)
    // ✅ Manicure cancelar agendamento CONFIRMADO (sem erro)  
    // ✅ Manicure marcar CONFIRMADO como CONCLUÍDO (sem erro)
    // ✅ Qualquer mudança em agendamentos não-pendentes (sem erro)
    
    const updatedAgendamento = await agendamentoService.updateAgendamento(id, agendamentoData);
    res.json(updatedAgendamento);
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/agendamentos/:id', async (req, res) => {
  const { id } = req.params;
  authorizeRoles(['admin', 'manicure']);
  try {
    await agendamentoService.deleteAgendamento(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
