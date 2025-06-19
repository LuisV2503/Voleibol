const express = require('express');
const router = express.Router();
const clubController = require('../controllers/clubController');

// Rutas para Clubes
router.post('/', clubController.crearClub);
router.get('/entrenador/:entrenadorId', clubController.obtenerClubesPorEntrenador);
router.get('/:id', clubController.obtenerClubPorId);
router.put('/:id', clubController.actualizarClub);
router.delete('/:id', clubController.eliminarClub);

// Rutas para Miembros
router.post('/:clubId/miembros', clubController.agregarMiembro);
router.delete('/:clubId/miembros/:miembroId', clubController.eliminarMiembro);
router.get('/deportista/:deportistaId', clubController.obtenerClubesDeDeportista);
router.get('/disponibles/:clubId', clubController.obtenerDeportistasDisponibles);


module.exports = router; 