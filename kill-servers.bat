@echo off
echo Terminando todos los procesos de Node.js...

REM Terminar procesos por nombre
taskkill /F /IM node.exe /T 2>nul
taskkill /F /IM ts-node-dev.exe /T 2>nul
taskkill /F /IM nodemon.exe /T 2>nul

REM Esperar un momento
timeout /t 2 /nobreak >nul

REM Verificar que el puerto 3001 esté libre
echo Verificando puerto 3001...
netstat -aon | findstr :3001

echo.
echo Procesos terminados. Ahora puedes reiniciar los servidores.
echo.
echo Para reiniciar:
echo   Backend:  cd backend ^&^& npm run dev
echo   Frontend: cd frontend ^&^& npm run dev
echo.
pause