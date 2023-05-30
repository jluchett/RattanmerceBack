const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const register = async (req, res) => {
  // Lógica para registrar un usuario
  try {
    const { email, password, question, answer } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'El usuario ya existe' });
    }

    // Crear un nuevo usuario
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedAnswer = await bcrypt.hash(answer,5);
    const newUser = new User({
      email,
      password: hashedPassword,
      secureQuestion: question,
      secureAnswer: hashedAnswer,
    });
    await newUser.save();

    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    console.error('Error al registrar el usuario:', error);
    res.status(500).json({ message: 'Error al registrar el usuario' });
  }
};

const login = async (req, res) => {
  // Lógica para iniciar sesión de un usuario
  try {
    const { email, password } = req.body;

    // Verificar si el usuario existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales no coinciden' });
    }

    // Generar token JWT
    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET);

    res.status(200).json({ token });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Busca el usuario por su correo electrónico
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Genera un token único para restablecer la contraseña
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiration = Date.now() + 3600000; // Expira en 1 hora
    await user.save();

    const transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.REMITE,
        pass: process.env.CONTRA,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    const resetUrl = "http://localhost:3001/users/forgotPass"
    const mailOptions = {
      from: process.env.REMITE,
      to: user.email,
      subject: 'Restablecimiento de contraseña',
      text: `Hola ${user.email.split('@')[0]},\n\nPara restablecer tu contraseña, haz clic en el siguiente enlace:\n\n${resetUrl}`,
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error al enviar el correo electrónico:', error);
      } else {
        console.log('Correo electrónico enviado:', info.response);
        res.json({ message: 'Se ha enviado un enlace al correo electrónico para restablecer la contraseña' });
      }
    });

  } catch (error) {
    console.error(
      'Error al solicitar el restablecimiento de contraseña:',
      error
    );
    res.status(500).json({
      message: 'Error al solicitar el restablecimiento de contraseña',
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Busca el usuario por el token de restablecimiento de contraseña
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'El enlace para restablecer la contraseña es inválido o ha expirado' });
    }

    // Actualiza la contraseña del usuario
    user.password = newPassword;
    user.resetToken = "hash";
    user.resetTokenExpiration = null;
    await user.save();

    res.json({ message: 'Contraseña restablecida correctamente' });
  } catch (error) {
    console.error('Error al restablecer la contraseña:', error);
    res.status(500).json({ message: 'Error al restablecer la contraseña' });
  }
};

const deleteUser = async (req, res) => {
  try {
    // Obtén el ID del usuario a eliminar desde los parámetros de la solicitud
    const { id } = req.params;
    // Elimina el usuario de la base de datos
    await User.findByIdAndRemove(id);
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el usuario:', error);
    res.status(500).json({ message: 'Error al eliminar el usuario' });
  }
};

const getUsers = async (req, res) => {
  try {
    const allUsers = await User.find();
    res.json(allUsers);
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    res.status(500).json({ message: 'Error al obtener los usuarios:' });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  deleteUser,
  getUsers,
};
