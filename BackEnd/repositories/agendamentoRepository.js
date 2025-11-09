import Agendamento from "../models/Agendamento.js";

const getAgendamento = async (id) => {
  return Agendamento.findById(id);
};

const getAllAgendamentos = async () => {
  return Agendamento.find();
};

const saveAgendamento = async ({serviceId, tempoAproximado, dataAgendamento, clientId, manicureId, status, adicionais}) => {
  const newAgendamento = new Agendamento({ serviceId, tempoAproximado, dataAgendamento, clientId, manicureId, status, adicionais });
  return newAgendamento.save();
};

const updateAgendamento = async (id, update) => {
  return Agendamento.findByIdAndUpdate(id, update, { new: true });
};

const deleteAgendamento = async (id) => {
  return Agendamento.findByIdAndDelete(id);
};

const agendamentoRepository = {
  getAgendamento,
  getAllAgendamentos,
  saveAgendamento,
  updateAgendamento,
  deleteAgendamento
};

export default agendamentoRepository;
