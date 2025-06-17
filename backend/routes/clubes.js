const express = require('express');
const router = express.Router();
const clubController = require('../controllers/clubController');

// Crear club
router.post('/', clubController.crearClub);
// Agregar deportistas a un club
router.post('/agregar-deportistas', clubController.agregarDeportistas);
// Listar clubes de un entrenador
router.get('/entrenador/:entrenadorId', clubController.listarClubesEntrenador);
// Eliminar club
router.delete('/:clubId', clubController.eliminarClub);
// Editar club
router.put('/:clubId', clubController.editarClub);

module.exports = router; 