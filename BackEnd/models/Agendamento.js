import mongoose from 'mongoose';
import Servico from './Servico.js';

const agendamentoSchema = new mongoose.Schema({
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Servico',
        required: true
    },
    tempoAproximado: {
        type: String,
        required: true
    },
    dataAgendamento: {
        type: Date,
        required: true
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    manicureId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pendente', 'confirmado', 'cancelado', 'concluido'],
        default: 'pendente'
    },
    dataCadastro: {
        type: Date,
        default: Date.now
    },
    adicionais: [
        {
            nome: { type: String, required: true },
            preco: { type: Number, required: true },
            porUnidade: { type: Boolean, default: false },
            quantidade: { type: Number, default: 1 }
        }
    ]
});

const Agendamento = mongoose.model('Agendamento', agendamentoSchema);

export default Agendamento;
