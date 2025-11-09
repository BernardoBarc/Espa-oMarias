import User from '../models/User.js';

const getUser = async (id) => {
  try {
    const user = await User.findById(id);
    return user;
  } catch (error) {
    throw new Error('Erro ao buscar usuário');
  }
};

const getAllUsers = async () => {
  try {
    const users = await User.find();
    return users;
  } catch (error) {
    throw new Error('Erro ao buscar usuários');
  }
};

const saveUser = async ({ name, email, phone, password, servicesId, role, endereco, nascimento, especialidade, photo, instagram, adicionais }) => {
  try {
    const newUser = new User({ name, email, phone, password, servicesId, role, endereco, nascimento, especialidade, photo, instagram, adicionais });
    return await newUser.save();
  } catch (error) {
    throw new Error(error);
  }
};

const updateUser = async (id, userData) => {
  try {
    // aceitar quaisquer campos presentes em userData (phoneCode, emailCode, flags, etc.)
    const user = await User.findByIdAndUpdate(id, userData, { new: true });
    return user;
  } catch (error) {
    // repassar mensagem original para diagnóstico (ex.: E11000 duplicate key)
    throw new Error(error.message || 'Erro ao atualizar usuário');
  }
};

const deleteUser = async (id) => {
  try {
    await User.findByIdAndDelete(id);
  } catch (error) {
    throw new Error('Erro ao deletar usuário');
  }
};

const findByEmail = async (email) => {
  try {
    const user = await User.findOne({ email });
    return user;
  } catch (error) {
    throw new Error('Erro ao buscar usuário por email');
  }
};

const userRepository = {
  getUser,
  getAllUsers,
  saveUser,
  findByEmail,
  updateUser,
  deleteUser
};

export default userRepository;
