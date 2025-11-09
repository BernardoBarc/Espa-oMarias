import express from "express";
import dadosSalaoService from "../services/dadosSalaoService.js";

const router = express.Router();

function normalizeDados(d) {
    if (!d) return {};
    const obj = (typeof d.toObject === 'function') ? d.toObject() : { ...d };
    // garantir campos
    const normalizeImage = (f) => {
        if (!f) return { url: '', title: '', description: '' };
        if (typeof f === 'string') return { url: f, title: '', description: '' };
        // já é objeto
        return {
            url: f.url || (f.path || ''),
            title: f.title || '',
            description: f.description || ''
        };
    };
    obj.fotosServicos = (obj.fotosServicos || []).map(normalizeImage);
    obj.fotosHome = (obj.fotosHome || []).map(normalizeImage);
    // manter ambas chaves para compatibilidade
    if (obj.phone && !obj.telefone) obj.telefone = obj.phone;
    if (obj.telefone && !obj.phone) obj.phone = obj.telefone;
    return obj;
}

// Rota explícita para GET /dadosSalao (sem id) — retorna primeiro documento
router.get('/dadosSalao', async (req, res) => {
    try {
        const all = await dadosSalaoService.getAllDadosSalao();
        const result = (all && all.length > 0) ? normalizeDados(all[0]) : {};
        return res.json(result);
    } catch (error) {
        console.error('Erro em GET /dadosSalao:', error);
        res.status(500).json({ error: error.message });
    }
});

// Alias com hífen para compatibilidade front-end
router.get('/dados-salao', async (req, res) => {
    try {
        const all = await dadosSalaoService.getAllDadosSalao();
        const result = (all && all.length > 0) ? normalizeDados(all[0]) : {};
        return res.json(result);
    } catch (error) {
        console.error('Erro em GET /dados-salao:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET por id
router.get('/dadosSalao/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const dadosSalao = await dadosSalaoService.getDadosSalao(id);
        res.json(normalizeDados(dadosSalao));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Alias com hífen
router.get('/dados-salao/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const dadosSalao = await dadosSalaoService.getDadosSalao(id);
        res.json(normalizeDados(dadosSalao));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST criar (aceita fotosServicos e fotosHome)
router.post(['/criarDadosSalao', '/dadosSalao', '/atualizarDadosSalao', '/dados-salao'], async (req, res) => {
    const { phone, endereco, instagram, email, photo, fotosServicos, fotosHome, telefone } = req.body;
    try {
        // aceitar 'telefone' do body também
        const phoneToSave = phone || telefone || '';
        const newDadosSalao = await dadosSalaoService.saveDadosSalao({ phone: phoneToSave, endereco, instagram, email, photo, fotosServicos, fotosHome });
        res.status(201).json(normalizeDados(newDadosSalao));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Handler de atualização usado por várias rotas PUT
const updateHandler = async (req, res) => {
    let id = req.params.id;
    const { _id, phone, endereco, instagram, email, photo, fotosServicos, fotosHome, telefone } = req.body;
    try {
        if (!id) id = _id; // tenta usar _id do body
        // se ainda não tem id, tenta atualizar o primeiro documento existente
        if (!id) {
            const all = await dadosSalaoService.getAllDadosSalao();
            if (all && all.length > 0) id = all[0]._id;
        }
        if (!id) return res.status(400).json({ error: 'ID não informado para atualização' });

        const phoneToSave = phone || telefone || '';
        const updatedDadosSalao = await dadosSalaoService.updateDadosSalao(id, { phone: phoneToSave, endereco, instagram, email, photo, fotosServicos, fotosHome });
        res.json(normalizeDados(updatedDadosSalao));
    } catch (error) {
        console.error('Erro em updateHandler:', error);
        res.status(500).json({ error: error.message });
    }
};

// Registrar rotas PUT sem parâmetros opcionais e aliases com hífen
router.put('/atualizarDadosSalao', updateHandler);
router.put('/atualizarDadosSalao/:id', updateHandler);
router.put('/dadosSalao', updateHandler);
router.put('/dadosSalao/:id', updateHandler);
router.put('/dados-salao', updateHandler);
router.put('/dados-salao/:id', updateHandler);

// DELETE
router.delete(['/deletarDadosSalao/:id', '/dadosSalao/:id', '/dados-salao/:id'], async (req, res) => {
    const { id } = req.params;
    try {
        await dadosSalaoService.deleteDadosSalao(id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota para limpar apenas as URLs das imagens (mantendo title/description quando existirem)
router.post('/limpar-imagens-dados-salao', async (req, res) => {
    try {
        const all = await dadosSalaoService.getAllDadosSalao();
        if (!all || all.length === 0) return res.status(404).json({ error: 'Nenhum documento de dados do salão encontrado' });
        const doc = all[0];
        const id = doc._id;
        const normalizeImageClear = (f) => {
            if (!f) return { url: '', title: '', description: '' };
            if (typeof f === 'string') return { url: '', title: '', description: '' };
            return { url: '', title: f.title || '', description: f.description || '' };
        };
        const fotosServicos = (doc.fotosServicos || []).map(normalizeImageClear);
        const fotosHome = (doc.fotosHome || []).map(normalizeImageClear);
        const updated = await dadosSalaoService.updateDadosSalao(id, {
            phone: doc.phone || doc.telefone || '',
            endereco: doc.endereco || '',
            instagram: doc.instagram || '',
            email: doc.email || '',
            fotosServicos,
            fotosHome
        });
        return res.json(normalizeDados(updated));
    } catch (error) {
        console.error('Erro em POST /limpar-imagens-dados-salao:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;