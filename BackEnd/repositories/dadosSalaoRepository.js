import DadosSalao from "../models/dadosSalao.js";

const getDadosSalao = async (id) => {
   try {
    const dadosSalao = await DadosSalao.findById(id);
       return dadosSalao;
   } catch (error) {
       throw new Error(error);
   }
};

const getAllDadosSalao = async () => {
    try {
        const dadosSalao = await DadosSalao.find();
        return dadosSalao;
    } catch (error) {
        throw new Error(error);
    }
};

const saveDadosSalao = async ({ phone, endereco, instagram, email, fotosServicos, fotosHome }) => {
    try {
        const dadosSalao = new DadosSalao({ phone, endereco, instagram, email, fotosServicos: fotosServicos || [], fotosHome: fotosHome || [] });
        await dadosSalao.save();
        return dadosSalao;
    } catch (error) {
        throw new Error(error);
    }
};

const updateDadosSalao = async (id, { phone, endereco, instagram, email, fotosServicos, fotosHome }) => {
    try {
        const dadosSalao = await DadosSalao.findByIdAndUpdate(
            id,
            { phone, endereco, instagram, email, fotosServicos: fotosServicos || [], fotosHome: fotosHome || [] },
            { new: true }
        );
        return dadosSalao;
    } catch (error) {
        throw new Error(error);
    }
};

const deleteDadosSalao = async (id) => {
    try {
        await DadosSalao.findByIdAndDelete(id);
    } catch (error) {
        throw new Error(error);
    }
};

const dadosSalaoRepository = {
    getDadosSalao,
    getAllDadosSalao,
    saveDadosSalao,
    updateDadosSalao,
    deleteDadosSalao
};

export default dadosSalaoRepository;
