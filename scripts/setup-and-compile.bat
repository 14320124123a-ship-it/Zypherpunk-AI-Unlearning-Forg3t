@echo off
echo Setting up Scarb and compiling Cairo contracts
echo =============================================

echo Checking if Scarb is installed...
scarb --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Scarb not found in PATH, checking for local installation...
    if exist "..\scarb-v2.14.0-x86_64-pc-windows-msvc\bin\scarb.exe" (
        set SCARB_CMD="..\scarb-v2.14.0-x86_64-pc-windows-msvc\bin\scarb.exe"
        echo Found local Scarb installation
    ) else (
        echo Scarb could not be found.
        echo Please install Scarb from: https://docs.swmansion.com/scarb/
        echo Then run this script again.
        pause
        exit /b 1
    )
) else (
    set SCARB_CMD=scarb
    echo Scarb is already installed
)

echo Verifying Scarb installation...
%SCARB_CMD% --version

echo Building the contract...
%SCARB_CMD% build

if %errorlevel% equ 0 (
    echo ✅ Contract compiled successfully!
    echo Artifacts are located in: target/dev/
) else (
    echo ❌ Contract compilation failed!
    pause
    exit /b 1
)

pause