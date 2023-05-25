const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());

// Ruta para el registro de usuarios
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  // Verifica si el usuario ya existe en la base de datos (aquí deberías usar una base de datos)
  // Aquí va tu código para verificar si el usuario ya existe

  // Si el usuario no existe, crea un hash del password y almacena el usuario en la base de datos (aquí deberías usar una base de datos)
  const hashedPassword = bcrypt.hashSync(password, 10);
  // Aquí va tu código para almacenar el usuario en la base de datos

  // Genera un token de sesión para el nuevo usuario
  const token = jwt.sign({ username }, 'secret_key');

  res.json({ token });
});

// Inicia el servidor en el puerto 3000
app.listen(3000, () => {
  console.log('Servidor iniciado en el puerto 3000');
});
