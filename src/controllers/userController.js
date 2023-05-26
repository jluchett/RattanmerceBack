const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');

const register = async (req, res) => {
  // Lógica para registrar un usuario
  try {
    const { email, password } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'El usuario ya existe' });
    }

    // Crear un nuevo usuario
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      password: hashedPassword,
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

    // Envía un correo electrónico al usuario con un enlace para restablecer la contraseña
    // Configura el transporte de correo
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'slucheta854@gmail.com',
        pass: 'LrSj@2014',
      },
    });
    // Aquí puedes utilizar una librería para enviar correos electrónicos, como Nodemailer
    const resetUrl = "http://localhost:3000/users/resetPass"
    const mailOptions = {
      from: 'slucheta854@gmail.com',
      to: user.email,
      subject: 'Restablecimiento de contraseña',
      text: `Hola ${user.email.split("@")[0]},\n\nPara restablecer tu contraseña, haz clic en el siguiente enlace:\n\n${resetUrl}`,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error al enviar el correo electrónico:', error);
        return res.status(500).json({ message: 'Error al enviar el correo electrónico' });
      }
      console.log('Correo electrónico enviado:', info.response);
      res.json({ message: 'Se ha enviado un enlace al correo electrónico para restablecer la contraseña' });
    });

    res.json({
      message:
        'Se ha enviado un enlace al correo electrónico para restablecer la contraseña',
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
      return res
        .status(400)
        .json({
          message:
            'El enlace para restablecer la contraseña es inválido o ha expirado',
        });
    }

    // Actualiza la contraseña del usuario
    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.json({ message: 'Contraseña restablecida correctamente' });
  } catch (error) {
    console.error('Error al restablecer la contraseña:', error);
    res.status(500).json({ message: 'Error al restablecer la contraseña' });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
};
