const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    correo: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    rol: {
        type: String,
        enum: ['entrenador', 'deportista'],
        required: true
    },
    entrenadorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: function() {
            return this.rol === 'deportista';
        }
    },
    numeroCelular: {
        type: String,
        trim: true
    },
    documento: {
        type: String,
        trim: true
    },
    rolPrincipal: {
        type: String,
        enum: ['Punta', 'Central', 'Opuesto', 'Armador', 'Líbero'],
        trim: true
    },
    rolSecundario: {
        type: String,
        enum: ['Punta', 'Central', 'Opuesto', 'Armador', 'Líbero'],
        trim: true
    }
}, {
    timestamps: true
});

// Método para cifrar contraseña antes de guardar
usuarioSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Método para comparar contraseñas
usuarioSchema.methods.compararPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Usuario', usuarioSchema); 