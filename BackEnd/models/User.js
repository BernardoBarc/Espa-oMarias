import mongoose, { Schema } from "mongoose";

const UserSchema = new mongoose.Schema({
name: { 
  type: String, 
  required: true 
},
email: { 
  type: String, 
  required: true, 
  unique: true 
},
password: { 
  type: String, 
  required: true 
},
role: { 
  type: String, 
  enum: ['client','manicure','admin'], 
  default: 'client' 
},
phone: { 
  type: String 
},
phoneVerified: { type: Boolean, default: false },
emailVerified: { type: Boolean, default: false },
phoneCode: { type: String },
emailCode: { type: String },
phoneCodeExpires: { type: Date },
emailCodeExpires: { type: Date },
// Campos para recuperação de senha
resetCode: { type: String },
resetCodeExpires: { type: Date },
// Campos pendentes para armazenar o contato desejado até confirmação
phonePending: { type: String },
emailPending: { type: String },
servicesId: [{ 
  type: Schema.Types.ObjectId,
  ref: 'services' 
}],
endereco: { 
  type: String 
},
nascimento: {
  type: Date
},
especialidade: { 
  type: String 
},
instagram: {
  type: String
},
photo: {
  type: String // base64 ou url
},
createdAt: { 
  type: Date, 
  default: Date.now 
},
updatedAt: { 
  type: Date, 
  default: Date.now 
}
});

// Middleware para atualizar updatedAt automaticamente
UserSchema.pre(['findOneAndUpdate', 'updateOne', 'update'], function() {
  this.set({ updatedAt: new Date() });
});

const User = mongoose.model('User', UserSchema);
export default User;