const express = require('express');
const router = express.Router();
const deportistaController = require('../controllers/deportistaController');

// Obtener lista de deportistas de un entrenador
router.get('/entrenador/:entrenadorId', deportistaController.getDeportistas);

// Obtener estadísticas generales de todos los deportistas
router.get('/estadisticas/:entrenadorId', deportistaController.getEstadisticasGenerales);

<<<<<<< HEAD
// Obtener información de un entrenador por ID
router.get('/entrenador-info/:id', deportistaController.getEntrenadorById);

=======
>>>>>>> ccec36d3d50f58e38df9f21950d9c1333aa75de1
module.exports = router; 