import dadosSalaoRepository from "../repositories/dadosSalaoRepository.js";

const getDadosSalao = async (id) => {
    return dadosSalaoRepository.getDadosSalao(id);
};

const getAllDadosSalao = async () => {
    return dadosSalaoRepository.getAllDadosSalao();
};

const saveDadosSalao = async ({email, phone, endereco, instagram, fotosServicos, fotosHome}) => {
    return dadosSalaoRepository.saveDadosSalao({email, phone, endereco, instagram, fotosServicos, fotosHome});
};

const updateDadosSalao = async (id, {email, phone, endereco, instagram, fotosServicos, fotosHome}) => {
    return dadosSalaoRepository.updateDadosSalao(id, {email, phone, endereco, instagram, fotosServicos, fotosHome});
};

const deleteDadosSalao = async (id) => {
    return dadosSalaoRepository.deleteDadosSalao(id);
};

const dadosSalaoService = {
    getDadosSalao,
    getAllDadosSalao,
    saveDadosSalao,
    updateDadosSalao,
    deleteDadosSalao
};

export default dadosSalaoService;
