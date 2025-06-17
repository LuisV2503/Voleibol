const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    entrenador: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    deportistas: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Club', clubSchema); 