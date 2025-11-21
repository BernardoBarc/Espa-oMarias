import mongoose from "mongoose";

const imagemSchema = new mongoose.Schema({
  url: { type: String, required: true },
  title: { type: String, default: "" },
  description: { type: String, default: "" }
}, { _id: false });

const dadosSalaoSchema = new mongoose.Schema({
  phone: { 
    type: String, 
    required: true 
  },
  endereco: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true 
  },
  instagram: {
    type: String
  },
  fotosServicos: {
    type: [imagemSchema],
    default: []
  },
  fotosHome: {
    type: [imagemSchema],
    default: []
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const DadosSalao = mongoose.model("DadosSalao", dadosSalaoSchema);

export default DadosSalao;
