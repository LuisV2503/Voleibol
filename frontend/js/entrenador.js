document.addEventListener('DOMContentLoaded', () => {
    // Verificar sesión
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario || usuario.rol !== 'entrenador') {
        window.location.href = 'index.html';
        return;
    }

    // Mostrar datos del perfil
    document.getElementById('entrenadorNombre').textContent = usuario.nombre;
    document.getElementById('entrenadorCorreo').textContent = usuario.correo;

    // Cerrar sesión
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('usuario');
        window.location.href = 'index.html';
    });

    // Cargar lista de deportistas asociados
    const listaDeportistas = document.getElementById('listaDeportistas');
    fetch(`https://voleibol.onrender.com/api/deportistas/entrenador/${usuario._id}`)
        .then(res => {
            if (!res.ok) throw new Error('Error al cargar deportistas');
            return res.json();
        })
        .then(data => {
            listaDeportistas.innerHTML = '';
            if (!Array.isArray(data) || data.length === 0) {
                listaDeportistas.innerHTML = '<li class="list-group-item text-center text-muted">No tienes deportistas asociados.</li>';
            } else {
                data.forEach(dep => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item deportista-item';
                    li.style.cursor = 'pointer';
                    li.innerHTML = `<strong>${dep.nombre}</strong> <br><span class='text-muted small'>${dep.correo}</span>`;
                    li.addEventListener('click', () => mostrarModalDeportista(dep));
                    listaDeportistas.appendChild(li);
                });
            }
        })
        .catch(err => {
            console.error('Error al cargar deportistas:', err);
            listaDeportistas.innerHTML = '<li class="list-group-item text-center text-danger">Error al cargar deportistas.</li>';
        });

    // Agregar selector de categoría para el ranking
    const rankingDiv = document.getElementById('rankingDeportistas');
    const categorias = [
        { key: 'saque', label: 'Saque' },
        { key: 'armada', label: 'Armada' },
        { key: 'remate', label: 'Remate' },
        { key: 'bloqueo', label: 'Bloqueo' },
        { key: 'defensa', label: 'Defensa' },
        { key: 'recepcion', label: 'Recepción' },
        { key: 'asistencia', label: 'Asistencia' }
    ];
    let datosRanking = [];
    const tipoActividadRanking = document.getElementById('tipoActividadRanking');

    function renderSelectorRanking() {
        let html = '<div class="mb-2 text-end">';
        html += '<label class="me-2">Ordenar ranking por:</label>';
        html += '<select id="selectorCategoriaRanking" class="form-select d-inline-block w-auto">';
        html += '<option value="global">Efectividad Global</option>';
        categorias.forEach(cat => {
            html += `<option value="${cat.key}">${cat.label}</option>`;
        });
        html += '</select></div>';
        rankingDiv.innerHTML = html + '<div id="listaRanking"></div>';
        document.getElementById('selectorCategoriaRanking').addEventListener('change', e => {
            renderRanking();
        });
    }

    function renderRanking() {
        // Obtener la categoría seleccionada del selector de ranking, si existe
        let categoriaSeleccionada = 'global';
        const selector = document.getElementById('selectorCategoriaRanking');
        if (selector) {
            categoriaSeleccionada = selector.value;
        }
        let ranking = datosRanking.map(dep => {
            let valor;
            // Efectividad global: promedio de todos los porcentajes de habilidades
            const porcentajes = dep.porcentajes || {};
            const valores = Object.values(porcentajes).filter(v => typeof v === 'number' && !isNaN(v));
            valor = valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;
            // Si se selecciona una categoría específica, usar solo esa
            if (categoriaSeleccionada && categoriaSeleccionada !== 'global') {
                valor = typeof porcentajes[categoriaSeleccionada] === 'number' ? porcentajes[categoriaSeleccionada] : 0;
            }
            return {
                nombre: dep.deportista.nombre,
                correo: dep.deportista.correo,
                valor: valor
            };
        }).sort((a, b) => b.valor - a.valor);
        let rHtml = '<ol class="list-group list-group-numbered">';
        ranking.forEach(dep => {
            rHtml += `<li class="list-group-item d-flex justify-content-between align-items-center">
                <span><strong>${dep.nombre}</strong> <span class='text-muted small'>${dep.correo}</span></span>
                <span class="badge bg-success rounded-pill">${dep.valor.toFixed(1)}%</span>
            </li>`;
        });
        rHtml += '</ol>';
        document.getElementById('listaRanking').innerHTML = rHtml;
    }

    function cargarEstadisticasYRanking() {
        const estadisticasDiv = document.getElementById('estadisticasGenerales');
        rankingDiv.innerHTML = 'Cargando...';
        estadisticasDiv.innerHTML = 'Cargando...';
        fetch(`https://voleibol.onrender.com/api/deportistas/estadisticas/${usuario._id}`)
            .then(res => res.json())
            .then(data => {
                // Filtrar por tipo de actividad
                const tipoActividad = tipoActividadRanking.value;
                let dataFiltrada = data;
                if (tipoActividad !== 'todos') {
                    dataFiltrada = data.map(dep => {
                        // Filtrar entrenamientos por tipoSesion
                        const entrenamientos = dep.entrenamientos?.filter(e => (e.tipoSesion || 'entrenamiento') === tipoActividad) || [];
                        // Calcular estadísticas por tipo
                        const tipos = ['saque','armada','remate','bloqueo','defensa','recepcion','asistencia'];
                        const stats = {};
                        tipos.forEach(tipo => { stats[tipo] = { total: 0, exitosos: 0 }; });
                        entrenamientos.forEach(ent => {
                            ent.ejercicios.forEach(ej => {
                                if (tipos.includes(ej.tipo)) {
                                    stats[ej.tipo].total++;
                                    if (ej.efectividad) stats[ej.tipo].exitosos++;
                                }
                            });
                        });
                        // Calcular porcentajes
                        const porcentajes = {};
                        tipos.forEach(tipo => {
                            const { total, exitosos } = stats[tipo];
                            porcentajes[tipo] = total > 0 ? (exitosos / total) * 100 : 0;
                        });
                        return {
                            deportista: dep.deportista,
                            estadisticas: stats,
                            porcentajes
                        };
                    });
                }
                // Estadísticas generales (promedio por ejercicio)
                if (!Array.isArray(dataFiltrada) || dataFiltrada.length === 0) {
                    estadisticasDiv.innerHTML = '<span class="text-muted">No hay datos suficientes.</span>';
                    rankingDiv.innerHTML = '<span class="text-muted">No hay datos suficientes.</span>';
                    return;
                }
                // Calcular promedios por ejercicio
                const ejercicios = ['saque','armada','remate','bloqueo','defensa','recepcion','asistencia'];
                const promedios = {};
                ejercicios.forEach(ej => {
                    let suma = 0, cuenta = 0;
                    dataFiltrada.forEach(dep => {
                        if (typeof dep.porcentajes[ej] === 'number') {
                            suma += dep.porcentajes[ej];
                            cuenta++;
                        }
                    });
                    promedios[ej] = cuenta ? (suma/cuenta) : 0;
                });
                let html = '<div class="row">';
                ejercicios.forEach(ej => {
                    const label = categorias.find(c=>c.key===ej)?.label || ej;
                    html += `<div class='col-6 col-md-4 mb-2'><strong>${label}:</strong> <span class='text-primary'>${promedios[ej].toFixed(1)}%</span></div>`;
                });
                html += '</div>';
                estadisticasDiv.innerHTML = html;
                // Ranking de deportistas (guardamos los datos y renderizamos)
                datosRanking = dataFiltrada;
                renderSelectorRanking();
                renderRanking();
            })
            .catch(err => {
                estadisticasDiv.innerHTML = '<span class="text-danger">Error al cargar estadísticas.</span>';
                rankingDiv.innerHTML = '<span class="text-danger">Error al cargar ranking.</span>';
                console.error('Error al cargar estadísticas/ranking:', err);
            });
    }

    tipoActividadRanking.addEventListener('change', cargarEstadisticasYRanking);

    // Al cargar la página, mostrar solo entrenamientos por defecto
    tipoActividadRanking.value = 'entrenamiento';
    cargarEstadisticasYRanking();
});

// Función para mostrar el modal con gráficas individuales
async function mostrarModalDeportista(deportista) {
    document.getElementById('modalDeportistaNombre').textContent = deportista.nombre;
    document.getElementById('modalDeportistaCorreo').textContent = deportista.correo;
    const container = document.getElementById('modalEstadisticasContainer');
    const tipoActividadSelect = document.getElementById('modalTipoActividad');

    // Función para cargar y filtrar datos según tipo de actividad
    async function cargarDatosModal(tipoActividad) {
        container.innerHTML = '<div class="text-center">Cargando estadísticas...</div>';
        try {
            const res = await fetch(`https://voleibol.onrender.com/api/entrenamientos/deportista/${deportista._id}`);
            if (!res.ok) throw new Error('No se pudieron cargar los entrenamientos');
            const entrenamientos = await res.json();
            console.log('Entrenamientos recibidos:', entrenamientos);
            // Filtrar por tipo de actividad
            let entrenamientosFiltrados = entrenamientos;
            if (tipoActividad !== 'todos') {
                entrenamientosFiltrados = entrenamientos.filter(e => (e.tipoSesion || 'entrenamiento') === tipoActividad);
            }
            // Calcular estadísticas
            const tipos = ['saque','armada','remate','bloqueo','defensa','recepcion','asistencia'];
            const estadisticas = {};
            tipos.forEach(tipo => {
                estadisticas[tipo] = { total: 0, exitosos: 0 };
            });
            entrenamientosFiltrados.forEach(ent => {
                ent.ejercicios.forEach(ej => {
                    if (tipos.includes(ej.tipo)) {
                        estadisticas[ej.tipo].total++;
                        if (ej.efectividad) estadisticas[ej.tipo].exitosos++;
                    }
                });
            });
            // Calcular porcentajes
            const porcentajes = {};
            tipos.forEach(tipo => {
                const { total, exitosos } = estadisticas[tipo];
                porcentajes[tipo] = total > 0 ? (exitosos / total) * 100 : 0;
            });
            // Mostrar porcentajes de efectividad
            let html = '<div class="row mb-2">';
            tipos.forEach(ejercicio => {
                html += `<div class='col-6 col-md-4 mb-1'><strong>${ejercicio.charAt(0).toUpperCase() + ejercicio.slice(1)}:</strong> <span class='text-primary'>${porcentajes[ejercicio].toFixed(1)}%</span></div>`;
            });
            html += '</div>';
            container.innerHTML = html + '<div class="row" id="modalGraficasEvolucion"></div>';
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
            // Procesar evolución
            const fechas = [];
            const datos = {saque:[],armada:[],remate:[],bloqueo:[],defensa:[],recepcion:[],asistencia:[]};
            entrenamientosFiltrados.slice().reverse().forEach(ent => {
                const fecha = new Date(ent.fecha).toLocaleDateString();
                fechas.push(fecha);
                const tiposEj = {saque:[],armada:[],remate:[],bloqueo:[],defensa:[],recepcion:[],asistencia:[]};
                ent.ejercicios.forEach(ej => tiposEj[ej.tipo]?.push(ej.efectividad));
                Object.keys(datos).forEach(tipo => {
                    const arr = tiposEj[tipo];
                    const pct = arr.length ? (arr.filter(x=>x).length/arr.length)*100 : null;
                    datos[tipo].push(pct);
                });
            });
            // Graficas pequeñas
            const graficasDiv = document.getElementById('modalGraficasEvolucion');
            Object.keys(datos).forEach(tipo => {
                const div = document.createElement('div');
                div.className = 'col-12 col-md-4 mb-2';
                div.innerHTML = `<h6 class='text-center mb-1'>${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</h6><canvas id='modal-grafica-evolucion-${tipo}' height='120'></canvas>`;
                graficasDiv.appendChild(div);
                const ctx = document.getElementById(`modal-grafica-evolucion-${tipo}`).getContext('2d');
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: fechas,
                        datasets: [{
                            label: tipo.charAt(0).toUpperCase() + tipo.slice(1),
                            data: datos[tipo],
                            borderColor: colores[tipo],
                            backgroundColor: colores[tipo] + '22',
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
        } catch (error) {
            console.error('Error al cargar entrenamientos:', error);
            container.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
        }
    }

    // Escuchar cambios en el selector
    tipoActividadSelect.addEventListener('change', (e) => {
        cargarDatosModal(e.target.value);
    });

    // Cargar por defecto con 'entrenamiento'
    cargarDatosModal('entrenamiento');

    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById('modalDeportista'));
    modal.show();
} 