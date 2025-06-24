const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Ruta de registro
router.post('/registro', authController.registro);

// Ruta de login
router.post('/login', authController.login);

// Ruta para obtener la información de un usuario por su ID
router.get('/user/:id', authController.getUserById);

// Ruta para editar el perfil del usuario
router.put('/editar-perfil/:id', authController.editarPerfil);

module.exports = router; 