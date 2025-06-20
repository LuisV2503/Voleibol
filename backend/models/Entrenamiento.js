const mongoose = require('mongoose');

const entrenamientoSchema = new mongoose.Schema({
    deportistaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    clubId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: true
    },
    fecha: {
        type: Date,
        required: true,
        default: Date.now
    },
    tipoSesion: {
        type: String,
        trim: true
    },
    ejercicios: [{
        tipo: {
            type: String,
            enum: ['saque', 'armada', 'remate', 'bloqueo', 'defensa', 'recepcion', 'asistencia'],
            required: true
        },
        efectividad: {
            type: Boolean,
            required: true
        },
        observaciones: {
            type: String,
            trim: true
        }
    }],
    duracion: {
        type: Number, // en minutos
        required: false
    },
    notas: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Índices para búsquedas eficientes
entrenamientoSchema.index({ deportistaId: 1, fecha: -1 });

module.exports = mongoose.model('Entrenamiento', entrenamientoSchema); 