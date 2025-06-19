const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
        const passwordValido = await bcrypt.compare(password, usuario.password);
        if (!passwordValido) {
            return res.status(400).json({ mensaje: 'Credenciales inválidas' });
        }

        // Crear token JWT
        const token = jwt.sign(
            { id: usuario._id, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '8h' } // El token expira en 8 horas
        );

        // Enviar información del usuario y el token
        res.json({
            token,
            usuario: {
                _id: usuario._id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol,
                entrenadorId: usuario.entrenadorId
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
}; 