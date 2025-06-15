const Usuario = require('../models/Usuario');

// Código secreto para entrenadores
const CODIGO_ENTRENADOR = 'ENTRENA-2025';

exports.registro = async (req, res) => {
    try {
        const { nombre, correo, password, rol, codigoEntrenador, correoEntrenador } = req.body;

        // Verificar si el usuario ya existe
        const usuarioExistente = await Usuario.findOne({ correo });
        if (usuarioExistente) {
            return res.status(400).json({ mensaje: 'El correo ya está registrado' });
        }

        // Validar código de entrenador si es necesario
        if (rol === 'entrenador' && codigoEntrenador !== CODIGO_ENTRENADOR) {
            return res.status(400).json({ mensaje: 'Código de entrenador inválido' });
        }

        // Buscar entrenador si es deportista
        let entrenadorId = null;
        if (rol === 'deportista') {
            const entrenador = await Usuario.findOne({ 
                correo: correoEntrenador,
                rol: 'entrenador'
            });
            if (!entrenador) {
                return res.status(400).json({ mensaje: 'Entrenador no encontrado' });
            }
            entrenadorId = entrenador._id;
        }

        // Crear nuevo usuario
        const usuario = new Usuario({
            nombre,
            correo,
            password,
            rol,
            entrenadorId
        });

        await usuario.save();

        // No enviar la contraseña en la respuesta
        const usuarioRespuesta = {
            _id: usuario._id,
            nombre: usuario.nombre,
            correo: usuario.correo,
            rol: usuario.rol,
            entrenadorId: usuario.entrenadorId
        };

        res.status(201).json(usuarioRespuesta);
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

exports.login = async (req, res) => {
    try {
        const { correo, password } = req.body;

        // Buscar usuario
        const usuario = await Usuario.findOne({ correo });
        if (!usuario) {
            return res.status(400).json({ mensaje: 'Credenciales inválidas' });
        }

        // Verificar contraseña
        const passwordValido = await usuario.compararPassword(password);
        if (!passwordValido) {
            return res.status(400).json({ mensaje: 'Credenciales inválidas' });
        }

        // Enviar información del usuario (sin password)
        const usuarioRespuesta = {
            _id: usuario._id,
            nombre: usuario.nombre,
            correo: usuario.correo,
            rol: usuario.rol,
            entrenadorId: usuario.entrenadorId
        };

        res.json(usuarioRespuesta);
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
}; 