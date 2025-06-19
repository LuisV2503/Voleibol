@echo off
ECHO =======================================================
ECHO ==       SCRIPT DE INICIO DE LA APLICACION           ==
ECHO =======================================================
ECHO.

REM Inicia el servidor del backend en una nueva ventana
ECHO [1/2] Iniciando el servidor del backend...
cd backend
start "Servidor Backend (Node.js)" npm start
cd ..

REM Espera unos segundos para que el servidor arranque completamente
ECHO [2/2] Abriendo la aplicacion en el navegador...
ECHO (Esperando 5 segundos a que el servidor este listo)
timeout /t 5 /nobreak > NUL

REM Abre el archivo index.html del frontend en el navegador por defecto
start frontend/index.html

ECHO.
ECHO =======================================================
ECHO ==                PROCESO COMPLETADO                 ==
ECHO =======================================================
ECHO.
ECHO - La ventana del servidor del backend se ha abierto. No la cierres.
ECHO - La aplicacion se ha abierto en tu navegador.
ECHO.
ECHO Ya puedes cerrar esta ventana.
ECHO. 