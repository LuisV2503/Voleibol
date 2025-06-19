const Club = require('../models/Club');
const Usuario = require('../models/Usuario');

// Crear un nuevo club
exports.crearClub = async (req, res) => {
    try {
        const { nombre, descripcion, entrenadorId } = req.body;
        const nuevoClub = new Club({ nombre, descripcion, entrenadorId });
        await nuevoClub.save();
        res.status(201).json(nuevoClub);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear el club', error });
    }
};

// Obtener todos los clubes de un entrenador
exports.obtenerClubesPorEntrenador = async (req, res) => {
    try {
        const { entrenadorId } = req.params;
        const clubes = await Club.find({ entrenadorId });
        res.json(clubes);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los clubes', error });
    }
};

// Obtener un club por ID
exports.obtenerClubPorId = async (req, res) => {
    try {
        const club = await Club.findById(req.params.id).populate('miembros', 'nombre correo');
        if (!club) {
            return res.status(404).json({ mensaje: 'Club no encontrado' });
        }
        res.json(club);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener el club', error });
    }
};

// Actualizar un club
exports.actualizarClub = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        const club = await Club.findByIdAndUpdate(req.params.id, { nombre, descripcion }, { new: true });
        if (!club) {
            return res.status(404).json({ mensaje: 'Club no encontrado' });
        }
        res.json(club);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar el club', error });
    }
};

// Eliminar un club
exports.eliminarClub = async (req, res) => {
    try {
        const club = await Club.findByIdAndDelete(req.params.id);
        if (!club) {
            return res.status(404).json({ mensaje: 'Club no encontrado' });
        }
        res.json({ mensaje: 'Club eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar el club', error });
    }
};

// Agregar un miembro a un club
exports.agregarMiembro = async (req, res) => {
    try {
        const { clubId } = req.params;
        const { deportistaId } = req.body;

        const club = await Club.findById(clubId);
        if (!club) {
            return res.status(404).json({ mensaje: 'Club no encontrado' });
        }

        // Verificar si el miembro ya está en el club
        if (club.miembros.includes(deportistaId)) {
            return res.status(400).json({ mensaje: 'El deportista ya es miembro de este club' });
        }

        club.miembros.push(deportistaId);
        await club.save();
        res.json(club);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al agregar miembro al club', error });
    }
};

// Eliminar un miembro de un club
exports.eliminarMiembro = async (req, res) => {
    try {
        const { clubId, miembroId } = req.params;

        await Club.findByIdAndUpdate(clubId, {
            $pull: { miembros: miembroId }
        });

        res.json({ mensaje: 'Miembro eliminado del club exitosamente' });
    } catch (error) {
        console.error('Error al eliminar miembro:', error);
        res.status(500).json({ mensaje: 'Error al eliminar miembro del club', error });
    }
};

// Obtener clubes a los que pertenece un deportista
exports.obtenerClubesDeDeportista = async (req, res) => {
    try {
        const { deportistaId } = req.params;
        const clubes = await Club.find({ miembros: deportistaId });
        res.json(clubes);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los clubes del deportista', error });
    }
};

// Obtener deportistas que no están en un club
exports.obtenerDeportistasDisponibles = async (req, res) => {
    try {
        const { clubId } = req.params;
        const club = await Club.findById(clubId);
        if (!club) {
            return res.status(404).json({ mensaje: 'Club no encontrado' });
        }

        const deportistas = await Usuario.find({
            rol: 'deportista',
            entrenadorId: club.entrenadorId,
            _id: { $nin: club.miembros } // Excluir a los que ya son miembros
        });

        res.json(deportistas);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener deportistas disponibles', error });
    }
}; 