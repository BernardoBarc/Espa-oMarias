import userRepository from "../repositories/userRepository.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const getUser = async (id) => {
  return userRepository.getUser(id);
};

const getAllUsers = async () => {
  return userRepository.getAllUsers();
};

const saveUser = async ({ name, email, phone, password, role, servicesId, especialidade, nascimento, endereco, photo, instagram, adicionais }) => {
  return userRepository.saveUser({ name, email, phone, password, role, servicesId, especialidade, nascimento, endereco, photo, instagram, adicionais });
};

const updateUser = async (id, userData) => {
  // aceitar e encaminhar quaisquer campos (phoneCode, emailCode, phoneVerified, emailVerified, etc.)
  return userRepository.updateUser(id, userData);
};

const deleteUser = async (id) => {
  return userRepository.deleteUser(id);
};

const findByEmail = async (email) => {
  return userRepository.findByEmail(email);
};

const login = async (email, password) => {
  const user = await userRepository.findByEmail(email);
  if (!user) throw new Error("Usuário não encontrado.");

  const passwordValid = await bcrypt.compare(password, user.password);
  if (!passwordValid) throw new Error("Senha incorreta.");

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  return { token, role: user.role, name: user.name, _id: user._id };
};

const userService = {
  getUser,
  getAllUsers,
  saveUser,
  updateUser,
  deleteUser,
  findByEmail,
  login
};

export default userService;
