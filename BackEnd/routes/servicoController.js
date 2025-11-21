import express from "express";
import servicoService from "../services/servicoService.js";

const router = express.Router();
const authorizeRoles = (roles) => (req, res, next) => {
    const userRole = req.user?.role;
    if (!roles.includes(userRole)) {
        return res.status(403).json({ message: "Acesso negado" });
    }
    next();
};

router.get('/servicos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const servico = await servicoService.getServico(id);
        if (!servico) {
            return res.status(404).json({ message: "Serviço não encontrado" });
        }
        return res.json(servico);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

router.get('/servicos', async (req, res) => {
    try {
        const servicos = await servicoService.getAllServicos();
        return res.json(servicos);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

router.post("/servicos", async (req, res) => {
    const {name, preco, tempoAproximado, adicionais} = req.body;
    try {
        const newServico = await servicoService.saveServico({name, preco, tempoAproximado, adicionais});
        res.send(newServico);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.put("/servicos/:id", async (req, res) => {
    const { id } = req.params;
    const { name, preco, tempoAproximado, adicionais } = req.body;
    try {
        const servico = await servicoService.updateServico(id, { name, preco, tempoAproximado, adicionais });
        res.json(servico);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/servicos/:id', async (req, res) => {
    const { id } = req.params;
    authorizeRoles(['admin', 'manicure']);
    try {
        const deletedServico = await servicoService.deleteServico(id);
        return res.status(204).send();
    } catch (error) {
        return res.status(500).send(error);
    }
});



export default router;