import express from 'express';
import servicoController from './servicoController.js';
import agendamentoController from './agendamentoController.js';
import userController from './userController.js';
import dadosSalaoController from './dadosSalaoController.js';

const router = express.Router();


router.use(servicoController);
router.use(agendamentoController);
router.use(userController);
router.use(dadosSalaoController);


export default router;