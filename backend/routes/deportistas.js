const express = require('express');
const router = express.Router();
const deportistaController = require('../controllers/deportistaController');

// Obtener todos los deportistas de un entrenador
router.get('/entrenador/:entrenadorId', deportistaController.obtenerDeportistasPorEntrenador);

// Obtener información de un entrenador por su ID
router.get('/entrenador-info/:entrenadorId', deportistaController.obtenerEntrenadorInfo);

// Obtener estadísticas de todos los deportistas de un entrenador
router.get('/estadisticas/:entrenadorId', deportistaController.obtenerEstadisticasEntrenador);

module.exports = router; 