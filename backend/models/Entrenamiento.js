const mongoose = require('mongoose');

const entrenamientoSchema = new mongoose.Schema({
    deportistaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    fecha: {
<<<<<<< HEAD
        type: String,
        required: true
=======
        type: Date,
        required: true,
        default: Date.now
>>>>>>> ccec36d3d50f58e38df9f21950d9c1333aa75de1
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