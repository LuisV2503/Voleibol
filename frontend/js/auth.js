document.addEventListener('DOMContentLoaded', () => {
<<<<<<< HEAD
    const API_URL = 'https://voleibol.onrender.com';

=======
>>>>>>> ccec36d3d50f58e38df9f21950d9c1333aa75de1
    // Elementos del formulario de registro
    const registerForm = document.getElementById('registerForm');
    const entrenadorFields = document.getElementById('entrenadorFields');
    const deportistaFields = document.getElementById('deportistaFields');
    const rolInputs = document.querySelectorAll('input[name="rol"]');

    // Elementos del formulario de login
    const loginForm = document.getElementById('loginForm');

    // Manejar cambio de rol en el registro
    rolInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            if (e.target.value === 'entrenador') {
                entrenadorFields.classList.remove('d-none');
                deportistaFields.classList.add('d-none');
                document.getElementById('correoEntrenador').required = false;
                document.getElementById('codigoEntrenador').required = true;
            } else {
                entrenadorFields.classList.add('d-none');
                deportistaFields.classList.remove('d-none');
                document.getElementById('correoEntrenador').required = true;
                document.getElementById('codigoEntrenador').required = false;
            }
        });
    });

    // Manejar envío del formulario de registro
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Formulario de registro enviado');

        const formData = {
            nombre: document.getElementById('nombre').value,
            correo: document.getElementById('correo').value,
            password: document.getElementById('password').value,
            rol: document.querySelector('input[name="rol"]:checked').value
        };

        // Agregar campos específicos según el rol
        if (formData.rol === 'entrenador') {
            formData.codigoEntrenador = document.getElementById('codigoEntrenador').value;
        } else {
            formData.correoEntrenador = document.getElementById('correoEntrenador').value;
        }

        console.log('Datos a enviar:', formData);

        try {
            console.log('Intentando conectar con el servidor...');
<<<<<<< HEAD
            const response = await fetch(`${API_URL}/api/auth/registro`, {
=======
            const response = await fetch('https://voleibol.onrender.com/api/auth/registro', {
>>>>>>> ccec36d3d50f58e38df9f21950d9c1333aa75de1
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            console.log('Respuesta recibida:', response.status);
            const data = await response.json();
            console.log('Datos recibidos:', data);

            if (response.ok) {
                console.log('Registro exitoso');
                // Guardar datos del usuario en localStorage
                localStorage.setItem('usuario', JSON.stringify(data));
                
                // Redirigir según el rol
                if (data.rol === 'entrenador') {
                    window.location.href = 'entrenador.html';
                } else {
                    window.location.href = 'deportista.html';
                }
            } else {
                console.error('Error en la respuesta:', data);
                mostrarError(data.mensaje, registerForm);
            }
        } catch (error) {
            console.error('Error completo:', error);
<<<<<<< HEAD
            mostrarError('Error al conectar con el servidor.', registerForm);
=======
            mostrarError('Error al conectar con el servidor. Asegúrate de que el servidor esté corriendo en https://voleibol.onrender.com', registerForm);
>>>>>>> ccec36d3d50f58e38df9f21950d9c1333aa75de1
        }
    });

    // Manejar envío del formulario de login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Formulario de login enviado');

        const formData = {
            correo: document.getElementById('loginCorreo').value,
            password: document.getElementById('loginPassword').value
        };

        try {
            console.log('Intentando conectar con el servidor...');
<<<<<<< HEAD
            const response = await fetch(`${API_URL}/api/auth/login`, {
=======
            const response = await fetch('https://voleibol.onrender.com/api/auth/login', {
>>>>>>> ccec36d3d50f58e38df9f21950d9c1333aa75de1
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            console.log('Respuesta recibida:', response.status);
            const data = await response.json();
            console.log('Datos recibidos:', data);

            if (response.ok) {
                console.log('Login exitoso');
<<<<<<< HEAD
                // Guardar datos del usuario y el token en localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                
                // Redirigir según el rol
                if (data.usuario.rol === 'entrenador') {
=======
                // Guardar datos del usuario en localStorage
                localStorage.setItem('usuario', JSON.stringify(data));
                
                // Redirigir según el rol
                if (data.rol === 'entrenador') {
>>>>>>> ccec36d3d50f58e38df9f21950d9c1333aa75de1
                    window.location.href = 'entrenador.html';
                } else {
                    window.location.href = 'deportista.html';
                }
            } else {
                console.error('Error en la respuesta:', data);
                mostrarError(data.mensaje, loginForm);
            }
        } catch (error) {
            console.error('Error completo:', error);
<<<<<<< HEAD
            mostrarError('Error al conectar con el servidor.', loginForm);
=======
            mostrarError('Error al conectar con el servidor. Asegúrate de que el servidor esté corriendo en https://voleibol.onrender.com', loginForm);
>>>>>>> ccec36d3d50f58e38df9f21950d9c1333aa75de1
        }
    });

    // Función para mostrar errores
    function mostrarError(mensaje, form) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger';
        alertDiv.textContent = mensaje;

        // Insertar el mensaje de error antes del formulario
        form.insertBefore(alertDiv, form.firstChild);

        // Eliminar el mensaje después de 5 segundos
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    // Verificar si hay un mensaje de error en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error) {
        const activeForm = document.querySelector('.tab-pane.active form');
        mostrarError(decodeURIComponent(error), activeForm);
    }
}); 