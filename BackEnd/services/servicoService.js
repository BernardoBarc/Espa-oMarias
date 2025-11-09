import servicoRepository from "../repositories/servicoRepository.js";

const getServico = async (id) => {
    return servicoRepository.getServico(id);
}

const getAllServicos = async () => {
    return servicoRepository.getAllServicos();
}

const saveServico = async (servicoData) => {
    return servicoRepository.saveServico(servicoData);
}

const updateServico = async (id, { name, preco, tempoAproximado, adicionais }) => {
    return servicoRepository.updateServico(id, { name, preco, tempoAproximado, adicionais });
}

const deleteServico = async (id) => {
    return servicoRepository.deleteServico(id);
}

const servicoService = {
    getServico,
    getAllServicos,
    saveServico,
    updateServico,
    deleteServico
};

export default servicoService;
