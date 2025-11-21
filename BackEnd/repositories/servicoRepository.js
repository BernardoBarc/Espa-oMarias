import Servico from '../models/Servico.js';

const getServico = async (id) => {
    try {
        const servico = await Servico.findById(id);
        return servico;
    } catch (error) {
        throw new Error('Erro ao buscar serviço');
    }
};
const getAllServicos = async () => {
    try {
        const servicos = await Servico.find();
        return servicos;
    } catch (error) {
        throw new Error('Erro ao buscar serviços');
    }
};
const saveServico = async ({name, preco, tempoAproximado, adicionais}) => {
    try {
        const newServico = new Servico({name, preco, tempoAproximado, adicionais});
        return await newServico.save();
    } catch (error) {
        throw new Error(error);
    }
}
const updateServico = async (id, { name, preco, tempoAproximado, adicionais }) => {
    try {
        const servico = await Servico.findByIdAndUpdate(id, { name, preco, tempoAproximado, adicionais }, { new: true });
        return servico;
    } catch (error) {
        throw new Error('Erro ao atualizar serviço');
    }
};
const deleteServico = async (id) => {
    try {
        const deleteServico = await Servico.findByIdAndDelete(id);
        return deleteServico;
    } catch (error) {
        throw new Error('Erro ao deletar serviço');
    }
};
const servicoRepository = {
    getServico,
    getAllServicos,
    saveServico,
    updateServico,
    deleteServico
};

export default servicoRepository;