document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://voleibol.onrender.com';
    const token = localStorage.getItem('token');

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
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });

    // Cargar lista de deportistas asociados
    const listaDeportistas = document.getElementById('listaDeportistas');
    fetch(`${API_URL}/api/deportistas/entrenador/${usuario._id}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
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
    const clubFilter = document.getElementById('clubFilter');

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

    async function cargarEstadisticasYRanking() {
        const estadisticasDiv = document.getElementById('estadisticasGenerales');
        rankingDiv.innerHTML = 'Cargando...';
        estadisticasDiv.innerHTML = 'Cargando...';

        try {
            // 1. Obtener todos los datos de estadísticas
            const res = await fetch(`${API_URL}/api/deportistas/estadisticas/${usuario._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            let data = await res.json();

            // 2. Obtener el club seleccionado
            const clubIdSeleccionado = clubFilter.value;

            // 3. Filtrar por club si es necesario
            if (clubIdSeleccionado !== 'todos') {
                const clubRes = await fetch(`${API_URL}/api/clubes/${clubIdSeleccionado}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const clubData = await clubRes.json();
                if (clubData && clubData.miembros) {
                    const idsMiembros = clubData.miembros.map(m => m._id);
                    data = data.filter(d => idsMiembros.includes(d.deportista._id));
                } else {
                    data = []; // Si no hay datos del club, el resultado es vacío
                }
            }
            
            // 4. Filtrar por tipo de actividad (código existente)
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
            
            if (!Array.isArray(dataFiltrada) || dataFiltrada.length === 0) {
                estadisticasDiv.innerHTML = '<span class="text-muted">No hay datos para la selección actual.</span>';
                rankingDiv.innerHTML = '<span class="text-muted">No hay datos para la selección actual.</span>';
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
            datosRanking = dataFiltrada;
            renderSelectorRanking();
            renderRanking();
        } catch (err) {
            estadisticasDiv.innerHTML = '<span class="text-danger">Error al cargar estadísticas.</span>';
            rankingDiv.innerHTML = '<span class="text-danger">Error al cargar ranking.</span>';
            console.error('Error al cargar estadísticas/ranking:', err);
        }
    }

    tipoActividadRanking.addEventListener('change', cargarEstadisticasYRanking);
    clubFilter.addEventListener('change', cargarEstadisticasYRanking);

    // Al cargar la página, mostrar solo entrenamientos por defecto
    tipoActividadRanking.value = 'entrenamiento';
    cargarEstadisticasYRanking();

    // Funciones para manejar clubes
    async function cargarClubes() {
        const listaClubes = document.getElementById('listaClubes');
        try {
            const res = await fetch(`${API_URL}/api/clubes/entrenador/${usuario._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const clubes = await res.json();
            
            // Renderizar lista de clubes
            listaClubes.innerHTML = '';
            // Llenar selector de filtro de clubes
            clubFilter.innerHTML = '<option value="todos">Todos los clubes</option>';
            if (clubes && clubes.length > 0) {
                clubes.forEach(club => {
                    const clubElement = document.createElement('div');
                    clubElement.className = 'list-group-item list-group-item-action flex-column align-items-start';
                    clubElement.style.cursor = 'pointer';
                    clubElement.innerHTML = `
                        <div class="d-flex w-100 justify-content-between">
                            <h6 class="mb-1">${club.nombre}</h6>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-outline-primary agregar-miembros" data-club-id="${club._id}" title="Agregar miembros">
                                    <i class="bi bi-person-plus"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-secondary editar-club" data-club-id="${club._id}" title="Editar club">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger eliminar-club" data-club-id="${club._id}" title="Eliminar club">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                        <p class="mb-1">${club.descripcion || 'Sin descripción'}</p>
                        <div class="collapse mt-2" id="miembros-${club._id}">
                            <!-- Aquí se cargarán los miembros -->
                        </div>
                    `;
                    listaClubes.appendChild(clubElement);

                    // Añadir opción al filtro del ranking
                    const option = document.createElement('option');
                    option.value = club._id;
                    option.textContent = club.nombre;
                    clubFilter.appendChild(option);
                });
            }

            // Agregar event listeners
            document.querySelectorAll('.list-group-item-action').forEach(item => {
                const clubId = item.querySelector('.agregar-miembros').dataset.clubId;
                
                // Evento para los botones
                item.querySelector('.agregar-miembros').addEventListener('click', (e) => {
                    e.stopPropagation();
                    mostrarModalAgregarMiembros(clubId);
                });
                item.querySelector('.editar-club').addEventListener('click', (e) => {
                    e.stopPropagation();
                    mostrarModalEditarClub(clubId);
                });
                item.querySelector('.eliminar-club').addEventListener('click', (e) => {
                    e.stopPropagation();
                    confirmarEliminarClub(clubId);
                });

                // Evento para el cuerpo del club
                item.addEventListener('click', (e) => {
                    if (e.target.closest('.btn-group')) return;
                    mostrarModalMiembros(clubId);
                });
            });

            // Cargar estadísticas después de cargar los clubes
            cargarEstadisticasYRanking();

        } catch (err) {
            console.error('Error al cargar clubes:', err);
            listaClubes.innerHTML = '<div class="text-center text-danger">Error al cargar clubes.</div>';
        }
    }

    // Guardar nuevo club
    const formCrearClub = document.getElementById('formCrearClub');
    formCrearClub.addEventListener('submit', async e => {
        e.preventDefault();
        const nombre = document.getElementById('nombreClub').value;
        const descripcion = document.getElementById('descripcionClub').value;
        try {
            await fetch(`${API_URL}/api/clubes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ nombre, descripcion, entrenadorId: usuario._id })
            });
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalCrearClub'));
            modal.hide();
            cargarClubes();
            mostrarMensaje('Club creado exitosamente', 'success');
        } catch (err) {
            console.error('Error al crear club:', err);
            mostrarMensaje('Error al crear el club', 'danger');
        }
    });

    async function mostrarModalEditarClub(clubId) {
        try {
            const res = await fetch(`${API_URL}/api/clubes/${clubId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const club = await res.json();
            
            document.getElementById('clubIdEditar').value = clubId;
            document.getElementById('nombreClubEditar').value = club.nombre;
            document.getElementById('descripcionClubEditar').value = club.descripcion || '';
            
            new bootstrap.Modal(document.getElementById('editarClubModal')).show();
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('Error al cargar datos del club', 'danger');
        }
    }

    document.getElementById('guardarEdicionClub').addEventListener('click', async () => {
        const clubId = document.getElementById('clubIdEditar').value;
        const nombre = document.getElementById('nombreClubEditar').value;
        const descripcion = document.getElementById('descripcionClubEditar').value;

        try {
            const res = await fetch(`${API_URL}/api/clubes/${clubId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ nombre, descripcion })
            });

            if (res.ok) {
                mostrarMensaje('Club actualizado exitosamente', 'success');
                document.getElementById('editarClubModal').querySelector('.btn-close').click();
                cargarClubes();
            } else {
                mostrarMensaje('Error al actualizar el club', 'danger');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('Error al conectar con el servidor', 'danger');
        }
    });

    async function confirmarEliminarClub(clubId) {
        if (confirm('¿Estás seguro de que deseas eliminar este club? Esta acción no se puede deshacer.')) {
            try {
                const res = await fetch(`${API_URL}/api/clubes/${clubId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    mostrarMensaje('Club eliminado exitosamente', 'success');
                    cargarClubes();
                } else {
                    mostrarMensaje('Error al eliminar el club', 'danger');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarMensaje('Error al conectar con el servidor', 'danger');
            }
        }
    }

    async function mostrarModalAgregarMiembros(clubId) {
        document.getElementById('clubIdMiembros').value = clubId;
        const listaDeportistas = document.getElementById('listaDeportistasModal');
        listaDeportistas.innerHTML = '<div class="text-center">Cargando deportistas...</div>';

        try {
            const res = await fetch(`${API_URL}/api/clubes/disponibles/${clubId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const deportistas = await res.json();
            
            listaDeportistas.innerHTML = deportistas.length ? '' : '<div class="text-center">No hay deportistas disponibles</div>';
            
            deportistas.forEach(deportista => {
                const elem = document.createElement('div');
                elem.className = 'list-group-item';
                elem.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-0">${deportista.nombre}</h6>
                            <small class="text-muted">${deportista.correo}</small>
                        </div>
                        <button class="btn btn-sm btn-primary agregar-deportista" data-deportista-id="${deportista._id}">
                            Agregar
                        </button>
                    </div>
                `;
                listaDeportistas.appendChild(elem);
            });

            // Event listeners para botones de agregar
            document.querySelectorAll('.agregar-deportista').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const deportistaId = btn.dataset.deportistaId;
                    try {
                        const res = await fetch(`${API_URL}/api/clubes/${clubId}/miembros`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ deportistaId })
                        });

                        if (res.ok) {
                            btn.closest('.list-group-item').remove();
                            mostrarMensaje('Deportista agregado exitosamente', 'success');
                        } else {
                            mostrarMensaje('Error al agregar deportista', 'danger');
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        mostrarMensaje('Error al conectar con el servidor', 'danger');
                    }
                });
            });

            new bootstrap.Modal(document.getElementById('agregarMiembrosModal')).show();
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('Error al cargar deportistas', 'danger');
        }
    }

    async function mostrarModalMiembros(clubId) {
        const modal = new bootstrap.Modal(document.getElementById('verMiembrosModal'));
        const modalTitulo = document.getElementById('verMiembrosModalTitulo');
        const listaMiembros = document.getElementById('listaMiembrosClub');
        
        listaMiembros.innerHTML = '<li>Cargando miembros...</li>';
        modal.show();

        try {
            const res = await fetch(`${API_URL}/api/clubes/${clubId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const club = await res.json();
            modalTitulo.textContent = `Miembros de ${club.nombre}`;
            
            if (club.miembros && club.miembros.length > 0) {
                listaMiembros.innerHTML = '';
                club.miembros.forEach(miembro => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item d-flex justify-content-between align-items-center';
                    li.innerHTML = `
                        <span>${miembro.nombre} <small class="text-muted">(${miembro.correo})</small></span>
                        <button class="btn btn-sm btn-outline-danger eliminar-miembro" data-miembro-id="${miembro._id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    `;
                    li.querySelector('.eliminar-miembro').addEventListener('click', () => {
                        confirmarEliminarMiembro(club._id, miembro._id, modal);
                    });
                    listaMiembros.appendChild(li);
                });
            } else {
                listaMiembros.innerHTML = '<li class="list-group-item">Este club no tiene miembros.</li>';
            }
        } catch (error) {
            console.error(error);
            listaMiembros.innerHTML = '<li class="list-group-item text-danger">Error al cargar miembros.</li>';
        }
    }

    async function confirmarEliminarMiembro(clubId, miembroId, modal) {
        if (confirm('¿Estás seguro de que quieres eliminar a este deportista del club?')) {
            try {
                const res = await fetch(`${API_URL}/api/clubes/${clubId}/miembros/${miembroId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    mostrarMensaje('Deportista eliminado del club', 'success');
                    // Recargar la lista de miembros en el modal
                    modal.hide();
                    mostrarModalMiembros(clubId);
                } else {
                    mostrarMensaje('Error al eliminar deportista', 'danger');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarMensaje('Error de conexión al eliminar', 'danger');
            }
        }
    }

    // Cargar clubes al iniciar
    cargarClubes();

    function mostrarMensaje(msg, tipo) {
        const container = document.querySelector('.container'); // Contenedor general para mostrar mensajes
        const div = document.createElement('div');
        div.className = `alert alert-${tipo} alert-dismissible fade show fixed-top m-3`;
        div.setAttribute('role', 'alert');
        div.innerHTML = `
            ${msg}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        container.prepend(div);
        setTimeout(() => {
            const alert = bootstrap.Alert.getOrCreateInstance(div);
            alert.close();
        }, 4000);
    }

    // Función para mostrar el modal con gráficas individuales
    async function mostrarModalDeportista(deportista) {
        document.getElementById('modalDeportistaNombre').textContent = deportista.nombre;
        document.getElementById('modalDeportistaCorreo').textContent = deportista.correo;
        const container = document.getElementById('modalEstadisticasContainer');
        const tipoActividadSelect = document.getElementById('modalTipoActividad');

        // Función para cargar y filtrar datos según tipo de actividad
        async function cargarDatosModal(tipoActividad = 'todos') {
            container.innerHTML = '<div class="text-center">Cargando estadísticas...</div>';
            try {
                // Obtener entrenamientos
                let entrenamientosRes = await fetch(`${API_URL}/api/entrenamientos/deportista/${deportista._id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                let entrenamientos = await entrenamientosRes.json();
                
                // Filtrar por tipo de actividad
                if (tipoActividad !== 'todos') {
                    entrenamientos = entrenamientos.filter(e => (e.tipoSesion || 'entrenamiento') === tipoActividad);
                }

                // Obtener estadísticas
                let estadisticasRes = await fetch(`${API_URL}/api/entrenamientos/estadisticas/${deportista._id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                let estadisticasData = await estadisticasRes.json();
                
                // Si se filtró por actividad, recalcular estadísticas
                if (tipoActividad !== 'todos') {
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
                    const porcentajes = {};
                    tipos.forEach(tipo => {
                        const { total, exitosos } = stats[tipo];
                        porcentajes[tipo] = total > 0 ? (exitosos / total) * 100 : 0;
                    });
                    estadisticasData = { estadisticas: stats, porcentajes };
                }

                // Renderizar datos en el modal
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
                entrenamientos.slice().reverse().forEach(ent => {
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

    // --- EDICIÓN DE PERFIL ---
    const btnEditarPerfil = document.getElementById('btnEditarPerfil');
    const modalEditarPerfil = new bootstrap.Modal(document.getElementById('modalEditarPerfil'));
    const formEditarPerfil = document.getElementById('formEditarPerfil');
    const inputNombre = document.getElementById('editarNombre');
    const inputCelular = document.getElementById('editarNumeroCelular');
    const inputDocumento = document.getElementById('editarDocumento');
    const selectRolPrincipal = document.getElementById('editarRolPrincipal');
    const selectRolSecundario = document.getElementById('editarRolSecundario');

    btnEditarPerfil.addEventListener('click', () => {
        inputNombre.value = usuario.nombre || '';
        inputCelular.value = usuario.numeroCelular || '';
        inputDocumento.value = usuario.documento || '';
        selectRolPrincipal.value = usuario.rolPrincipal || '';
        // Actualizar opciones de secundario
        actualizarOpcionesSecundario();
        selectRolSecundario.value = usuario.rolSecundario || '';
        modalEditarPerfil.show();
    });

    selectRolPrincipal.addEventListener('change', actualizarOpcionesSecundario);
    function actualizarOpcionesSecundario() {
        const principal = selectRolPrincipal.value;
        Array.from(selectRolSecundario.options).forEach(opt => {
            opt.disabled = (opt.value && opt.value === principal);
        });
        if (selectRolSecundario.value === principal) selectRolSecundario.value = '';
    }

    formEditarPerfil.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (selectRolPrincipal.value && selectRolPrincipal.value === selectRolSecundario.value) {
            alert('El rol secundario no puede ser igual al principal.');
            return;
        }
        try {
            const res = await fetch(`${API_URL}/api/auth/editar-perfil/${usuario._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nombre: inputNombre.value,
                    numeroCelular: inputCelular.value,
                    documento: inputDocumento.value,
                    rolPrincipal: selectRolPrincipal.value,
                    rolSecundario: selectRolSecundario.value
                })
            });
            const data = await res.json();
            if (res.ok) {
                // Actualizar localStorage y vista
                Object.assign(usuario, data.usuario);
                localStorage.setItem('usuario', JSON.stringify(usuario));
                document.getElementById('entrenadorNombre').textContent = usuario.nombre;
                modalEditarPerfil.hide();
                alert('Perfil actualizado correctamente');
            } else {
                alert(data.mensaje || 'Error al actualizar el perfil');
            }
        } catch (err) {
            alert('Error al conectar con el servidor');
        }
    });
    // --- FIN EDICIÓN DE PERFIL ---
});
