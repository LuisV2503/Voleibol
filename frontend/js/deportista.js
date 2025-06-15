document.addEventListener('DOMContentLoaded', async () => {
    // Verificar sesión
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario || usuario.rol !== 'deportista') {
        window.location.href = 'index.html';
        return;
    }

    // Mostrar datos del perfil
    document.getElementById('deportistaNombre').textContent = usuario.nombre;
    document.getElementById('deportistaCorreo').textContent = usuario.correo;

    // Obtener nombre del entrenador
    if (usuario.entrenadorId) {
        try {
            const res = await fetch(`https://voleibol.onrender.com/api/deportistas/entrenador/${usuario.entrenadorId}`);
            const entrenadores = await res.json();
            if (Array.isArray(entrenadores) && entrenadores.length > 0) {
                document.getElementById('entrenadorCorreo').textContent = entrenadores[0].nombre;
            } else {
                document.getElementById('entrenadorCorreo').textContent = 'No disponible';
            }
        } catch {
            document.getElementById('entrenadorCorreo').textContent = 'No disponible';
        }
    } else {
        document.getElementById('entrenadorCorreo').textContent = 'No asociado';
    }

    // Cerrar sesión
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('usuario');
        window.location.href = 'index.html';
    });

    // Manejar envío del formulario de entrenamiento
    const entrenamientoForm = document.getElementById('entrenamientoForm');
    entrenamientoForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Calcular efectividad por ejercicio
        const ejercicios = [
            'saque', 'armada', 'remate', 'bloqueo', 'defensa', 'recepcion', 'asistencia'
        ].map(tipo => {
            const buenos = parseInt(document.getElementById(`${tipo}_buenos`).value) || 0;
            const malos = parseInt(document.getElementById(`${tipo}_malos`).value) || 0;
            const total = buenos + malos;
            // Se envía un array de tantos ejercicios como repeticiones, para mantener compatibilidad con el backend y estadísticas
            return Array.from({length: total}, (_, i) => ({
                tipo,
                efectividad: i < buenos
            }));
        }).flat();

        const data = {
            deportistaId: usuario._id,
            fecha: document.getElementById('fecha').value,
            ejercicios,
            notas: document.getElementById('notas').value,
            tipoSesion: tipoSesionInput.value
        };

        try {
            const res = await fetch('https://voleibol.onrender.com/api/entrenamientos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (res.ok) {
                mostrarMensaje('Entrenamiento guardado correctamente', 'success');
                entrenamientoForm.reset();
                cargarEstadisticas();
            } else {
                mostrarMensaje(result.mensaje || 'Error al guardar', 'danger');
            }
        } catch (err) {
            mostrarMensaje('Error al conectar con el servidor', 'danger');
        }
    });

    // Mostrar estadísticas simples
    async function cargarEstadisticas() {
        const contenedor = document.getElementById('estadisticasDeportista');
        contenedor.innerHTML = 'Cargando...';
        try {
            const res = await fetch(`https://voleibol.onrender.com/api/entrenamientos/deportista/${usuario._id}`);
            const entrenamientos = await res.json();
            // Obtener estadísticas agregadas
            const resStats = await fetch(`https://voleibol.onrender.com/api/entrenamientos/estadisticas/${usuario._id}`);
            const data = await resStats.json();
            if (resStats.ok) {
                let html = '<div class="row">';
                Object.entries(data.porcentajes).forEach(([ejercicio, porcentaje]) => {
                    html += `<div class='col-6 col-md-4 mb-2'><strong>${ejercicio.charAt(0).toUpperCase() + ejercicio.slice(1)}:</strong> <span class='text-primary'>${porcentaje.toFixed(1)}%</span></div>`;
                });
                html += '</div>';
                contenedor.innerHTML = html;
                // Graficar evolución
                graficarRendimiento(entrenamientos);
            } else {
                contenedor.innerHTML = '<span class="text-danger">No se pudieron cargar las estadísticas.</span>';
            }
        } catch (err) {
            contenedor.innerHTML = '<span class="text-danger">Error al conectar con el servidor.</span>';
        }
    }

    function graficarRendimiento(entrenamientos) {
        const container = document.getElementById('graficasEvolucionContainer');
        container.innerHTML = '';
        // Agrupar por fecha
        const fechas = [];
        const datos = {
            saque: [], armada: [], remate: [], bloqueo: [], defensa: [], recepcion: [], asistencia: []
        };
        entrenamientos.slice().reverse().forEach(ent => {
            const fecha = new Date(ent.fecha).toLocaleDateString();
            fechas.push(fecha);
            // Calcular % efectividad por ejercicio ese día
            const tipos = {saque:[],armada:[],remate:[],bloqueo:[],defensa:[],recepcion:[],asistencia:[]};
            ent.ejercicios.forEach(ej => tipos[ej.tipo].push(ej.efectividad));
            Object.keys(datos).forEach(tipo => {
                const arr = tipos[tipo];
                const pct = arr.length ? (arr.filter(x=>x).length/arr.length)*100 : null;
                datos[tipo].push(pct);
            });
        });
        // Colores para cada habilidad
        const colores = {
            saque: '#0d6efd',
            armada: '#198754',
            remate: '#dc3545',
            bloqueo: '#ffc107',
            defensa: '#6f42c1',
            recepcion: '#0dcaf0',
            asistencia: '#fd7e14'
        };
        // Crear una gráfica de línea para cada habilidad
        Object.keys(datos).forEach(tipo => {
            const div = document.createElement('div');
            div.className = 'col-12 col-md-4 mb-3';
            div.innerHTML = `<h6 class='text-center mb-1'>${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</h6><canvas id='grafica-evolucion-${tipo}' height='80'></canvas>`;
            container.appendChild(div);
            const ctx = document.getElementById(`grafica-evolucion-${tipo}`).getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: fechas,
                    datasets: [{
                        label: tipo.charAt(0).toUpperCase() + tipo.slice(1),
                        data: datos[tipo],
                        borderColor: colores[tipo],
                        backgroundColor: colores[tipo] + '22', // color translúcido
                        spanGaps: true
                    }]
                },
                options: {
                    plugins: {legend: {display: false}},
                    scales: {y: {min:0,max:100,ticks:{callback:v=>v+'%'}}},
                    elements: {point: {radius: 2}},
                    layout: {padding: 0}
                }
            });
        });
    }

    cargarEstadisticas();

    // Función para mostrar mensajes
    function mostrarMensaje(msg, tipo) {
        const div = document.createElement('div');
        div.className = `alert alert-${tipo}`;
        div.textContent = msg;
        entrenamientoForm.parentNode.insertBefore(div, entrenamientoForm);
        setTimeout(() => div.remove(), 4000);
    }

    async function mostrarEstadisticas() {
        try {
            const response = await fetch(`https://voleibol.onrender.com/api/entrenamientos/estadisticas/${usuario._id}`);
            if (!response.ok) throw new Error('Error al cargar estadísticas');
            const data = await response.json();

            const container = document.getElementById('estadisticas-container');
            container.innerHTML = ''; // Limpiar contenedor

            // Crear una gráfica para cada habilidad
            const habilidades = ['saque', 'armada', 'remate', 'bloqueo', 'defensa', 'recepcion', 'asistencia'];
            
            habilidades.forEach(habilidad => {
                const canvasContainer = document.createElement('div');
                canvasContainer.className = 'col-md-6 mb-4';
                canvasContainer.innerHTML = `
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title text-center">${habilidad.charAt(0).toUpperCase() + habilidad.slice(1)}</h5>
                            <canvas id="grafica-${habilidad}"></canvas>
                        </div>
                    </div>
                `;
                container.appendChild(canvasContainer);

                const ctx = document.getElementById(`grafica-${habilidad}`).getContext('2d');
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Total', 'Exitosos'],
                        datasets: [{
                            label: 'Ejercicios',
                            data: [
                                data.estadisticas[habilidad].total,
                                data.estadisticas[habilidad].exitosos
                            ],
                            backgroundColor: [
                                'rgba(54, 162, 235, 0.5)',
                                'rgba(75, 192, 192, 0.5)'
                            ],
                            borderColor: [
                                'rgba(54, 162, 235, 1)',
                                'rgba(75, 192, 192, 1)'
                            ],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1
                                }
                            }
                        },
                        plugins: {
                            title: {
                                display: true,
                                text: `Efectividad: ${data.porcentajes[habilidad].toFixed(1)}%`
                            }
                        }
                    }
                });
            });
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('estadisticas-container').innerHTML = 
                '<div class="alert alert-danger">No se pudieron cargar las estadísticas</div>';
        }
    }

    // Manejar selección de tipo de sesión
    const btnEntrenamiento = document.getElementById('btnEntrenamiento');
    const btnPartidoEntrenamiento = document.getElementById('btnPartidoEntrenamiento');
    const btnPartido = document.getElementById('btnPartido');
    const tipoSesionInput = document.getElementById('tipoSesion');
    const tituloFormulario = document.getElementById('tituloFormulario');

    btnEntrenamiento.addEventListener('click', () => {
        tipoSesionInput.value = 'entrenamiento';
        tituloFormulario.textContent = 'Registrar Entrenamiento';
        btnEntrenamiento.classList.add('active');
        btnPartidoEntrenamiento.classList.remove('active');
        btnPartido.classList.remove('active');
    });
    btnPartidoEntrenamiento.addEventListener('click', () => {
        tipoSesionInput.value = 'partido_entrenamiento';
        tituloFormulario.textContent = 'Registrar Partido de Entrenamiento';
        btnEntrenamiento.classList.remove('active');
        btnPartidoEntrenamiento.classList.add('active');
        btnPartido.classList.remove('active');
    });
    btnPartido.addEventListener('click', () => {
        tipoSesionInput.value = 'partido';
        tituloFormulario.textContent = 'Registrar Partido';
        btnEntrenamiento.classList.remove('active');
        btnPartidoEntrenamiento.classList.remove('active');
        btnPartido.classList.add('active');
    });
    // Por defecto, activar el de entrenamiento
    btnEntrenamiento.classList.add('active');
}); 