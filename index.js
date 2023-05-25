const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./src/routes/userRoutes');
require('dotenv').config();

const app = express();

// Configuración de MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

// Middlewares globales
app.use(cors());
app.use(express.json());

// Rutas
app.use('/users', userRoutes);

// Middleware de error
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Error en el servidor' });
});

// Iniciar el servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
