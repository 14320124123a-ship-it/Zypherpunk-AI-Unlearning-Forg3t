@echo off
echo ========================================
echo Noir ^& Starknet Foundry Installation Helper
echo ========================================
echo.

echo This script will guide you through the installation process.
echo.

echo For the best experience on Windows, we recommend using WSL.
echo.

echo Press any key to open the installation guide in your browser...
pause >nul

echo Opening installation guide...
start "" "https://github.com/noir-lang/noir"
start "" "https://foundry-rs.github.io/starknet-foundry/"

echo.
echo Please follow the instructions in COMPLETE_TOOLCHAIN_INSTALLATION.md
echo.
echo After installation, you can test the tools by running:
echo   check_tools.ps1
echo.
echo Press any key to continue...
pause >nul