import Agendamento from "../models/Agendamento.js";
import agendamentoRepository from "../repositories/agendamentoRepository.js";

const getAgendamento = async (id) => {
  return agendamentoRepository.getAgendamento(id);
};

const getAllAgendamentos = async () => {
  return agendamentoRepository.getAllAgendamentos();
};

const saveAgendamento = async ({serviceId, tempoAproximado, dataAgendamento, clientId, manicureId, status, adicionais}) => {
  return agendamentoRepository.saveAgendamento({serviceId, tempoAproximado, dataAgendamento, clientId, manicureId, status, adicionais});
};

const updateAgendamento = async (id, update) => {
  return agendamentoRepository.updateAgendamento(id, update);
};

const deleteAgendamento = async (id) => {
  return agendamentoRepository.deleteAgendamento(id);
};

const agendamentoService = {
  getAgendamento,
  getAllAgendamentos,
  saveAgendamento,
  updateAgendamento,
  deleteAgendamento
};

export default agendamentoService;
