const Entrenamiento = require('../models/Entrenamiento');
const Usuario = require('../models/Usuario');

// Crear nuevo entrenamiento
exports.crearEntrenamiento = async (req, res) => {
    try {
        const { ejercicios, duracion, notas } = req.body;
        const deportistaId = req.body.deportistaId;

        // Verificar que el deportista existe
        const deportista = await Usuario.findById(deportistaId);
        if (!deportista || deportista.rol !== 'deportista') {
            return res.status(400).json({ mensaje: 'Deportista no encontrado' });
        }

        const entrenamiento = new Entrenamiento({
            deportistaId,
            ejercicios,
            duracion,
            notas
        });

        await entrenamiento.save();
        res.status(201).json(entrenamiento);
    } catch (error) {
        console.error('Error al crear entrenamiento:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

// Obtener entrenamientos de un deportista
exports.getEntrenamientosDeportista = async (req, res) => {
    try {
        const { deportistaId } = req.params;
        const entrenamientos = await Entrenamiento.find({ deportistaId })
            .sort({ fecha: -1 });
        res.json(entrenamientos);
    } catch (error) {
        console.error('Error al obtener entrenamientos:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

// Obtener estadísticas de un deportista
exports.getEstadisticasDeportista = async (req, res) => {
    try {
        const { deportistaId } = req.params;
        const entrenamientos = await Entrenamiento.find({ deportistaId });

        // Calcular estadísticas por tipo de ejercicio
        const tiposValidos = ['saque', 'armada', 'remate', 'bloqueo', 'defensa', 'recepcion', 'asistencia'];
        const estadisticas = {};
        tiposValidos.forEach(tipo => {
            estadisticas[tipo] = { total: 0, exitosos: 0 };
        });

        entrenamientos.forEach(entrenamiento => {
            entrenamiento.ejercicios.forEach(ejercicio => {
                if (!tiposValidos.includes(ejercicio.tipo)) return; // Ignorar ejercicios no válidos
                estadisticas[ejercicio.tipo].total++;
                if (ejercicio.efectividad) {
                    estadisticas[ejercicio.tipo].exitosos++;
                }
            });
        });

        // Calcular porcentajes
        const porcentajes = {};
        Object.keys(estadisticas).forEach(tipo => {
            const { total, exitosos } = estadisticas[tipo];
            porcentajes[tipo] = total > 0 ? (exitosos / total) * 100 : 0;
        });

        res.json({
            estadisticas,
            porcentajes
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
}; 