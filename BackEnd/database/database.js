import mongoose from "mongoose";

mongoose.connect("mongodb://localhost:27017/espaco_marias");

const db = mongoose.connection;

db.on("error", console.error.bind(console, "Erro de conexão:"));
db.once("open", () => {
  console.log("Conexão com o banco de dados estabelecida com sucesso!");
});

export default db;
