import mongoose from 'mongoose';

const servicoSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true },
  preco: { 
    type: Number, 
    required: true },
  tempoAproximado: { 
    type: String, 
    required: true },
  dataCadastro: {
    type: Date,
    default: Date.now
  },
  adicionais: [
    {
      nome: { type: String, required: true },
      preco: { type: Number, required: true },
      porUnidade: { type: Boolean, default: false },
    }
  ]
});

const Servico = mongoose.model('Servico', servicoSchema);

export default Servico;
