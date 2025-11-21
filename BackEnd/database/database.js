import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL || "mongodb://localhost:27017/espacomarias";

// Conectar ao MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Conexão com o banco de dados estabelecida com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao conectar com o banco de dados:", error);
    process.exit(1);
  }
};

// Iniciar conexão
connectDB();

const db = mongoose.connection;

db.on("error", console.error.bind(console, "❌ Erro de conexão:"));
db.on("disconnected", () => {
  console.log("⚠️ Desconectado do banco de dados");
});
db.on("reconnected", () => {
  console.log("🔄 Reconectado ao banco de dados");
});

export default db;
