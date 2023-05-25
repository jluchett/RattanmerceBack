const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  // Lógica para verificar el token JWT   
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403); // Token inválido, se devuelve un estado HTTP 403 (prohibido)
      }

      req.user = user; // Guardar los datos del usuario en la solicitud
      next();
    });
  } else {
    res.sendStatus(401); // No se proporcionó el token, se devuelve un estado HTTP 401 (no autorizado)
  }
};

module.exports = authenticateToken;
