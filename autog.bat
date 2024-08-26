@echo off
set "filepath=%~1"
if "%filepath%"=="" (
    echo Please provide a filepath as an argument.
    pause
    exit /b
)
if not exist "%filepath%" (
    echo The provided filepath does not exist.
    pause
    exit /b
)
echo Generating mod.json in %filepath%
(echo { & echo    "character": "", & echo    "description": "", & echo    "preview": "preview.jpg" & echo }) > "%filepath%\mod.json"

start "" "%filepath%\mod.json"