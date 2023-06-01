const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../auth/authentication')

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/forgotPass', userController.forgotPassword);
router.post('/resetPass/:token', userController.resetPassword);
router.get('/', userController.getUsers);

// Rutas protegidas
router.get('/user', authenticateToken, (req, res) => {
    // Acceso permitido solo a usuarios autenticados
    // Puedes acceder a los datos del usuario en req.user
    res.json({ user: req.user });
});
router.delete('/user/:id', userController.deleteUser);
router.put('/user/update/:id',userController.updateUser )

module.exports = router;
