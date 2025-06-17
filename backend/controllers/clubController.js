const Club = require('../models/Club');
const Usuario = require('../models/Usuario');

// Crear un nuevo club
exports.crearClub = async (req, res) => {
    try {
        const { nombre, entrenadorId } = req.body;
        if (!nombre || !entrenadorId) {
            return res.status(400).json({ mensaje: 'Nombre y entrenador requeridos' });
        }
        const club = new Club({ nombre, entrenador: entrenadorId });
        await club.save();
        res.status(201).json(club);
    } catch (error) {
        console.error('Error al crear club:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

// Agregar deportistas a un club
exports.agregarDeportistas = async (req, res) => {
    try {
        const { clubId, deportistas } = req.body;
        if (!clubId || !Array.isArray(deportistas)) {
            return res.status(400).json({ mensaje: 'Datos inválidos' });
        }
        const club = await Club.findById(clubId);
        if (!club) return res.status(404).json({ mensaje: 'Club no encontrado' });
        // Evitar duplicados
        club.deportistas = Array.from(new Set([...club.deportistas, ...deportistas]));
        await club.save();
        res.json(club);
    } catch (error) {
        console.error('Error al agregar deportistas:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

// Listar clubes de un entrenador
exports.listarClubesEntrenador = async (req, res) => {
    try {
        const { entrenadorId } = req.params;
        const clubes = await Club.find({ entrenador: entrenadorId }).populate('deportistas', 'nombre correo');
        res.json(clubes);
    } catch (error) {
        console.error('Error al listar clubes:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

// Eliminar club
exports.eliminarClub = async (req, res) => {
    try {
        const { clubId } = req.params;
        const club = await Club.findByIdAndDelete(clubId);
        if (!club) return res.status(404).json({ mensaje: 'Club no encontrado' });
        res.json({ mensaje: 'Club eliminado' });
    } catch (error) {
        console.error('Error al eliminar club:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

// Editar club (nombre)
exports.editarClub = async (req, res) => {
    try {
        const { clubId } = req.params;
        const { nombre } = req.body;
        if (!nombre) return res.status(400).json({ mensaje: 'Nombre requerido' });
        const club = await Club.findByIdAndUpdate(clubId, { nombre }, { new: true });
        if (!club) return res.status(404).json({ mensaje: 'Club no encontrado' });
        res.json(club);
    } catch (error) {
        console.error('Error al editar club:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
}; 