document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = 'https://voleibol.onrender.com';
    const token = localStorage.getItem('token');

    // Verificar sesión
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario || usuario.rol !== 'deportista') {
        window.location.href = 'index.html';
        return;
    }

    // Configuración de los selectores de fecha
    const months = [
        { name: "Enero", days: 31 },
        { name: "Febrero", days: 28 }, // Ajustable para años bisiestos
        { name: "Marzo", days: 31 },
        { name: "Abril", days: 30 },
        { name: "Mayo", days: 31 },
        { name: "Junio", days: 30 },
        { name: "Julio", days: 31 },
        { name: "Agosto", days: 31 },
        { name: "Septiembre", days: 30 },
        { name: "Octubre", days: 31 },
        { name: "Noviembre", days: 30 },
        { name: "Diciembre", days: 31 }
    ];

    // Inicializar selectores
    const monthSelect = document.getElementById('month');
    const daySelect = document.getElementById('day');
    const yearSelect = document.getElementById('year');

    // Llenar selector de meses
    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = month.name;
        monthSelect.appendChild(option);
    });

    // Llenar selector de años (2025-2035)
    for (let year = 2025; year <= 2035; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }

    // Función para actualizar días según el mes
    function updateDays() {
        const selectedMonth = months[monthSelect.value - 1];
        const selectedYear = parseInt(yearSelect.value);
        let daysInMonth = selectedMonth ? selectedMonth.days : 31;
        
        // Ajuste para febrero en año bisiesto
        if (selectedMonth && selectedMonth.name === "Febrero" && selectedYear) {
            if ((selectedYear % 4 === 0 && selectedYear % 100 !== 0) || selectedYear % 400 === 0) {
                daysInMonth = 29;
            }
        }

        // Guardar día seleccionado actual
        const currentDay = daySelect.value;
        
        // Limpiar y rellenar días
        daySelect.innerHTML = '<option value="">Día</option>';
        for (let i = 1; i <= daysInMonth; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            daySelect.appendChild(option);
        }

        // Restaurar día seleccionado si es válido
        if (currentDay && currentDay <= daysInMonth) {
            daySelect.value = currentDay;
        }
    }

    // Eventos para actualizar días
    monthSelect.addEventListener('change', updateDays);
    yearSelect.addEventListener('change', updateDays);

    // Inicializar días
    updateDays();

    // Mostrar datos del perfil
    document.getElementById('deportistaNombre').textContent = usuario.nombre;
    document.getElementById('deportistaCorreo').textContent = usuario.correo;

    // Obtener nombre del entrenador
    if (usuario.entrenadorId) {
        try {
            const res = await fetch(`${API_URL}/api/auth/user/${usuario.entrenadorId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const entrenador = await res.json();
            if (entrenador && entrenador.nombre) {
                document.getElementById('entrenadorCorreo').textContent = entrenador.nombre;
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
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });

    // Cargar clubes del deportista
    async function cargarClubesDeportista() {
        if (!usuario || !usuario._id) return;
        try {
            const res = await fetch(`${API_URL}/api/clubes/deportista/${usuario._id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const clubes = await res.json();
            
            // Mostrar clubes en el perfil
            const listaClubes = document.getElementById('listaClubesDeportista');
            listaClubes.innerHTML = clubes.length ? '' : '<div class="text-center text-muted">No perteneces a ningún club</div>';
            
            clubes.forEach(club => {
                const clubElement = document.createElement('div');
                clubElement.className = 'list-group-item';
                clubElement.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${club.nombre}</h6>
                            <small class="text-muted">${club.descripcion || 'Sin descripción'}</small>
                        </div>
                    </div>
                `;
                listaClubes.appendChild(clubElement);
            });

            // Actualizar selector de clubes para el entrenamiento
            const clubSelect = document.getElementById('clubSeleccionado');
            clubSelect.innerHTML = '<option value="">Seleccionar club...</option>';
            if (clubes && clubes.length > 0) {
                clubes.forEach(club => {
                    const option = document.createElement('option');
                    option.value = club._id;
                    option.textContent = club.nombre;
                    clubSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error al cargar clubes:', error);
            mostrarMensaje('Error al cargar los clubes', 'danger');
        }
    }

    // Cargar clubes al iniciar
    cargarClubesDeportista();

    // Manejar envío del formulario de entrenamiento
    const entrenamientoForm = document.getElementById('entrenamientoForm');
    entrenamientoForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const clubId = document.getElementById('clubSeleccionado').value;
        if (!clubId) {
            mostrarMensaje('Por favor selecciona un club', 'danger');
            return;
        }

        // Calcular efectividad por ejercicio
        const ejercicios = [
            'saque', 'armada', 'remate', 'bloqueo', 'defensa', 'recepcion', 'asistencia'
        ].map(tipo => {
            const buenos = parseInt(document.getElementById(`${tipo}_buenos`).value) || 0;
            const malos = parseInt(document.getElementById(`${tipo}_malos`).value) || 0;
            const total = buenos + malos;
            return Array.from({length: total}, (_, i) => ({
                tipo,
                efectividad: i < buenos
            }));
        }).flat();

        // Construir la fecha en formato YYYY-MM-DD
        const year = yearSelect.value;
        const month = monthSelect.value.padStart(2, '0');
        const day = daySelect.value.padStart(2, '0');
        const fecha = `${year}-${month}-${day}`;

        const data = {
            deportistaId: usuario._id,
            clubId: clubId,
            fecha: fecha,
            ejercicios,
            tipoSesion: document.getElementById('tipoSesion').value
        };

        try {
            const res = await fetch(`${API_URL}/api/entrenamientos`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
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

    // Llamar a cargarEstadisticas siempre al cargar la página
    cargarEstadisticas();

    // Colores por actividad para las gráficas SVG
    const coloresActividad = {
        saque: '#007bff',
        armada: '#28a745',
        remate: '#dc3545',
        bloqueo: '#ffc107',
        defensa: '#6f42c1',
        recepcion: '#17a2b8',
        asistencia: '#fd7e14'
    };

    function graficarLineaPorActividad(entrenamientos) {
        const container = document.getElementById('graficasEvolucionContainer');
        container.innerHTML = '';
        if (!entrenamientos.length) {
            console.log('No hay entrenamientos para graficar');
            return;
        }
        const actividades = ['saque', 'armada', 'remate', 'bloqueo', 'defensa', 'recepcion', 'asistencia'];
        let htmlContainer = `
            <div class='row justify-content-center'>
                <div class='col-12'>
                    <div class='graficas-flex d-flex flex-wrap justify-content-center gap-4'>`;
        
        actividades.forEach(actividad => {
            const color = coloresActividad[actividad] || '#007bff';
            const datosPorDia = entrenamientos.map(ent => {
                let total = 0, exitosos = 0;
                ent.ejercicios && ent.ejercicios.filter(ej => ej.tipo === actividad).forEach(ej => {
                    total++;
                    if (ej.efectividad) exitosos++;
                });
                const efectividad = total ? (exitosos / total) * 100 : null;
                const [year, month, day] = ent.fecha.split('-').map(num => parseInt(num, 10));
                return { dia: day, mes: month, efectividad, total };
            }).filter(d => d.efectividad !== null);

            // Ordenar por mes y día
            datosPorDia.sort((a, b) => {
                if (a.mes !== b.mes) {
                    return a.mes - b.mes;
                }
                return a.dia - b.dia;
            });

            const width = Math.max(250, datosPorDia.length * 40 + 60);
            const height = 150;
            let points = '';
            let circles = '';
            let labels = '';
            let gridLines = '';
            
            // Líneas de cuadrícula horizontales
            for (let i = 0; i <= 100; i += 25) {
                const y = 20 + (100 - i) * 0.9;
                gridLines += `<line x1='40' y1='${y}' x2='${width-20}' y2='${y}' 
                    stroke='#e0e0e0' stroke-width='1' stroke-dasharray='${i % 50 === 0 ? 'none' : '4'}'/>`;
            }

            // Línea vertical del eje Y
            gridLines += `<line x1='40' y1='20' x2='40' y2='${height-30}' stroke='#666' stroke-width='2'/>`;
            // Línea horizontal del eje X
            gridLines += `<line x1='40' y1='${height-30}' x2='${width-20}' y2='${height-30}' stroke='#666' stroke-width='2'/>`;

            datosPorDia.forEach((dato, i) => {
                const x = 40 + (i * ((width-60) / Math.max(datosPorDia.length - 1, 1)));
                const y = 20 + (100 - dato.efectividad) * 0.9;
                points += `${x},${y} `;
                
                // Círculos con efecto de brillo
                circles += `
                    <g>
                        <circle cx='${x}' cy='${y}' r='4' fill='${color}' stroke='white' stroke-width='1.5' filter='url(#glow)'>
                        </circle>
                        <circle cx='${x}' cy='${y}' r='12' fill='transparent' class='punto-hover'>
                            <title>Día ${dato.dia}:
Efectividad: ${dato.efectividad.toFixed(1)}%
Total ejercicios: ${dato.total}</title>
                        </circle>
                    </g>`;
                
                // Etiquetas de días con mes
                labels += `<text x='${x}' y='${height-10}' text-anchor='middle' 
                    font-size='12' fill='#666' font-weight='500'>${dato.dia}/${dato.mes}</text>`;
            });

            let svg = `
                <div class='grafica-card card shadow-sm p-3 mb-4' style='min-width: ${width + 40}px'>
                    <h6 class='text-center mb-3 fw-bold' style='color: ${color}'>
                        ${actividad.charAt(0).toUpperCase() + actividad.slice(1)}
                    </h6>
                    <svg width='${width}' height='${height}' style='overflow:visible'>
                        <defs>
                            <filter id='glow'>
                                <feGaussianBlur stdDeviation='1' result='coloredBlur'/>
                                <feMerge>
                                    <feMergeNode in='coloredBlur'/>
                                    <feMergeNode in='SourceGraphic'/>
                                </feMerge>
                            </filter>
                            <linearGradient id='grad${actividad}' x1='0%' y1='0%' x2='0%' y2='100%'>
                                <stop offset='0%' style='stop-color:${color};stop-opacity:0.2'/>
                                <stop offset='100%' style='stop-color:${color};stop-opacity:0'/>
                            </linearGradient>
                        </defs>
                        
                        ${gridLines}
                        
                        <!-- Área bajo la curva -->
                        <path d='${points}${width-20},${height-30} 40,${height-30}' 
                            fill='url(#grad${actividad})' opacity='0.3'/>
                        
                        <!-- Línea de tendencia -->
                        <polyline fill='none' stroke='${color}' stroke-width='3' 
                            points='${points.trim()}' stroke-linecap='round' 
                            stroke-linejoin='round'/>
                        
                        <!-- Etiquetas del eje Y -->
                        <text x='35' y='25' text-anchor='end' font-size='11' fill='#666'>100%</text>
                        <text x='35' y='${height/2}' text-anchor='end' font-size='11' fill='#666'>50%</text>
                        <text x='35' y='${height-30}' text-anchor='end' font-size='11' fill='#666'>0%</text>
                        
                        ${circles}
                        ${labels}
                    </svg>
                </div>`;
            
            htmlContainer += svg;
        });
        
        htmlContainer += `
                    </div>
                </div>
            </div>`;
        container.innerHTML = htmlContainer;
    }

    function nombreMesCorto(mes) {
        const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        return meses[mes-1];
    }

    // Llamar a la nueva gráfica personalizada por actividad
    async function cargarEstadisticas() {
        const contenedor = document.getElementById('estadisticasDeportista');
        contenedor.innerHTML = 'Cargando...';
        if (!usuario || !usuario._id) return;
        try {
            const res = await fetch(`${API_URL}/api/entrenamientos/estadisticas/${usuario._id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (res.ok) {
                let html = '<div class="row">';
                Object.entries(data.porcentajes).forEach(([ejercicio, porcentaje]) => {
                    html += `<div class='col-6 col-md-4 mb-2'><strong>${ejercicio.charAt(0).toUpperCase() + ejercicio.slice(1)}:</strong> <span class='text-primary'>${porcentaje.toFixed(1)}%</span></div>`;
                });
                html += '</div>';
                contenedor.innerHTML = html;
                // Graficar nueva línea personalizada por actividad
                graficarLineaPorActividad(data.entrenamientos);
            } else {
                contenedor.innerHTML = '<span class="text-danger">No se pudieron cargar las estadísticas.</span>';
            }
        } catch (err) {
            contenedor.innerHTML = '<span class="text-danger">Error al conectar con el servidor.</span>';
        }
    }

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
            const response = await fetch(`${API_URL}/api/entrenamientos/estadisticas/${usuario._id}`);
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

    // DEPURACIÓN: Mostrar el usuario y el entrenadorId en consola
    console.log('Usuario:', usuario);
    console.log('entrenadorId:', usuario.entrenadorId);
}); 