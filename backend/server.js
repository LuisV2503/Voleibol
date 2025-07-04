const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/auth');
const deportistasRoutes = require('./routes/deportistas');
const entrenamientosRoutes = require('./routes/entrenamientos');
const clubesRoutes = require('./routes/clubes');

const app = express();

// Middlewares
// Habilitamos CORS para permitir solicitudes desde el frontend en Render.
const corsOptions = {
  origin: 'https://voleibol-1.onrender.com',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json()); // Para parsear el body de las peticiones a JSON

// Conexión a la base de datos
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Conectado a MongoDB'))
.catch(err => console.error('No se pudo conectar a MongoDB', err));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/deportistas', deportistasRoutes);
app.use('/api/entrenamientos', entrenamientosRoutes);
app.use('/api/clubes', clubesRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`)); 