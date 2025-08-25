@echo off
echo Setting up DeepSeek API environment variables for Lotus development...
echo.

REM DeepSeek API Configuration
set ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic
set ANTHROPIC_AUTH_TOKEN=%1
set ANTHROPIC_MODEL=deepseek-chat
set ANTHROPIC_SMALL_FAST_MODEL=deepseek-chat

echo Environment variables set:
echo ANTHROPIC_BASE_URL=%ANTHROPIC_BASE_URL%
echo ANTHROPIC_AUTH_TOKEN=***hidden***
echo ANTHROPIC_MODEL=%ANTHROPIC_MODEL%
echo ANTHROPIC_SMALL_FAST_MODEL=%ANTHROPIC_SMALL_FAST_MODEL%
echo.

if "%1"=="" (
    echo Usage: setup-deepseek-env.bat YOUR_API_KEY
    echo.
    echo Example: setup-deepseek-env.bat sk-1234567890abcdef
    echo.
    pause
    exit /b 1
)

echo ✅ DeepSeek environment configured successfully!
echo.
echo You can now use DeepSeek API with Anthropic-compatible tools.
echo.
pause