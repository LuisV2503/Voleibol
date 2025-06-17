const express = require('express');
const router = express.Router();
const entrenamientoController = require('../controllers/entrenamientoController');

// Crear nuevo entrenamiento
router.post('/', entrenamientoController.crearEntrenamiento);

// Obtener entrenamientos de un deportista
router.get('/deportista/:deportistaId', entrenamientoController.getEntrenamientosDeportista);

// Obtener estadísticas de un deportista
router.get('/estadisticas/:deportistaId', entrenamientoController.getEstadisticasDeportista);

module.exports = router; 