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
// Habilitamos CORS para todos los orígenes y manejamos pre-flight.
app.use(cors());
app.options('*', cors()); // Habilitar pre-flight para todas las rutas
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