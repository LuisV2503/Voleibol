const express = require('express');
const router = express.Router();
const deportistaController = require('../controllers/deportistaController');

// Obtener lista de deportistas de un entrenador
router.get('/entrenador/:entrenadorId', deportistaController.getDeportistas);

// Obtener estadísticas generales de todos los deportistas
router.get('/estadisticas/:entrenadorId', deportistaController.getEstadisticasGenerales);

// Obtener información de un entrenador por ID
router.get('/entrenador-info/:id', deportistaController.getEntrenadorById);

module.exports = router; 