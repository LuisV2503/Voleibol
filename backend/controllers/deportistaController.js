const Usuario = require('../models/Usuario');
const Entrenamiento = require('../models/Entrenamiento');

// Obtener lista de deportistas de un entrenador
exports.obtenerDeportistasPorEntrenador = async (req, res) => {
    try {
        const { entrenadorId } = req.params;
        
        // Verificar que el entrenador existe
        const entrenador = await Usuario.findById(entrenadorId);
        if (!entrenador || entrenador.rol !== 'entrenador') {
            return res.status(400).json({ mensaje: 'Entrenador no encontrado' });
        }

        // Obtener todos los deportistas asociados
        const deportistas = await Usuario.find({ 
            entrenadorId,
            rol: 'deportista'
        }).select('-password');

        if (!deportistas) {
            return res.status(404).json({ mensaje: 'No se encontraron deportistas' });
        }

        res.json(deportistas);
    } catch (error) {
        console.error('Error al obtener deportistas:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

// Obtener información de un entrenador por ID
exports.obtenerEntrenadorInfo = async (req, res) => {
    try {
        const { entrenadorId } = req.params;
        const entrenador = await Usuario.findById(entrenadorId).select('nombre correo');
        if (!entrenador || entrenador.rol !== 'entrenador') {
            return res.status(404).json({ mensaje: 'Entrenador no encontrado' });
        }
        res.json(entrenador);
    } catch (error) {
        console.error('Error al obtener entrenador:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

// Obtener estadísticas de todos los deportistas de un entrenador
exports.obtenerEstadisticasEntrenador = async (req, res) => {
    try {
        const { entrenadorId } = req.params;
        
        // Obtener todos los deportistas
        const deportistas = await Usuario.find({ 
            entrenadorId,
            rol: 'deportista'
        });

        // Obtener estadísticas de cada deportista
        const estadisticas = await Promise.all(deportistas.map(async (deportista) => {
            const entrenamientos = await Entrenamiento.find({ deportistaId: deportista._id });
            
            // Calcular estadísticas por tipo de ejercicio
            const tiposValidos = ['saque', 'armada', 'remate', 'bloqueo', 'defensa', 'recepcion', 'asistencia'];
            const stats = {};
            tiposValidos.forEach(tipo => {
                stats[tipo] = { total: 0, exitosos: 0 };
            });

            entrenamientos.forEach(entrenamiento => {
                entrenamiento.ejercicios.forEach(ejercicio => {
                    if (!tiposValidos.includes(ejercicio.tipo)) return;
                    stats[ejercicio.tipo].total++;
                    if (ejercicio.efectividad) {
                        stats[ejercicio.tipo].exitosos++;
                    }
                });
            });

            // Calcular porcentajes
            const porcentajes = {};
            Object.keys(stats).forEach(tipo => {
                const { total, exitosos } = stats[tipo];
                porcentajes[tipo] = total > 0 ? (exitosos / total) * 100 : 0;
            });

            return {
                deportista: {
                    _id: deportista._id,
                    nombre: deportista.nombre,
                    correo: deportista.correo
                },
                estadisticas: stats,
                porcentajes,
                entrenamientos
            };
        }));

        res.json(estadisticas);
    } catch (error) {
        console.error('Error al obtener estadísticas generales:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
}; 