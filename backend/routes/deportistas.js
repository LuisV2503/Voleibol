const express = require('express');
const router = express.Router();
const deportistaController = require('../controllers/deportistaController');

// Obtener lista de deportistas de un entrenador
router.get('/entrenador/:entrenadorId', deportistaController.getDeportistas);

// Obtener estadísticas generales de todos los deportistas
router.get('/estadisticas/:entrenadorId', deportistaController.getEstadisticasGenerales);

module.exports = router; 