const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const register = async (req, res) => {
  // Lógica para registrar un usuario
  try {
    const { email, password } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'El email ya está registrado',
      });
    }

    // Crear un nuevo usuario
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      password: hashedPassword,
      resetToken: 'hash',
      resetTokenExpiration: Date.now(),
      name: '',
      address: '',
      phoneNumber: 0,
      city: '',
    });
    await newUser.save();
    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
    });
  } catch (error) {
    console.error('Error al registrar el usuario:', error);
    res.status(500).json({ message: 'Error al registrar el usuario' });
  }
};
const login = async (req, res) => {
  try {
    const { email } = req.query;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Email no está registrado',
      });
    }
    return res.json({
      success: true,
      usuario: user,
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
};
const singin = async (req, res) => {
  // Lógica para iniciar sesión de un usuario
  try {
    const { email, password } = req.body;

    // Verificar si el usuario existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales no coinciden' });
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
        rejectUnauthorized: false,
      },
    });
    const resetUrl = `http://localhost:3001/users/resetPass/${resetToken}`;
    const mailOptions = {
      from: process.env.REMITE,
      to: user.email,
      subject: 'Restablecimiento de contraseña',
      text: `Hola ${
        user.email.split('@')[0]
      },\n\nPara restablecer tu contraseña, haz clic en el siguiente enlace:\n\n${resetUrl}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error al enviar el correo electrónico:', error);
      } else {
        console.log('Correo electrónico enviado:', info.response);
        res.json({
          message:
            'Se ha enviado un enlace al correo electrónico para restablecer la contraseña',
        });
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
    const { resetToken } = req.params;
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ error: 'Digite la nueva contraseña' });
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    // Busca el usuario por el token de restablecimiento de contraseña
    const user = await User.findOneAndUpdate(
      { resetToken: resetToken, resetTokenExpiration: { $gt: Date.now() } },
      // Actualiza la contraseña del usuario
      { password: passwordHash },
      { new: true }
    );

    if (!user) {
      return res.status(400).json({
        message:
          'El enlace para restablecer la contraseña es inválido o ha expirado',
      });
    }

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

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phoneNumber, city } = req.body;

    if (!name || !address || !phoneNumber || !city) {
      return res
        .status(400)
        .json({ error: 'Todos los campos son obligatorios' });
    }

    // Verifica el formato y la longitud de los campos
    if (name.length < 2 || name.length > 50) {
      return res
        .status(400)
        .json({ error: 'El nombre debe tener entre 2 y 50 caracteres' });
    }
    const user = await User.findByIdAndUpdate(
      id,
      { name, address, phoneNumber, city },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error al actualizar la informacion del usuario', error);
    res
      .status(500)
      .json({ message: 'Error al actualizar la informacion del usuario' });
  }
};

module.exports = {
  register,
  login,
  singin,
  forgotPassword,
  resetPassword,
  deleteUser,
  getUsers,
  updateUser,
};
