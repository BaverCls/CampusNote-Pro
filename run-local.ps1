$ErrorActionPreference = "Stop"

$repoRoot = $PSScriptRoot
$python = "python"
if (Get-Command py -ErrorAction SilentlyContinue) {
    $python = "py -3"
}

Set-Location $repoRoot

$venvPython = Join-Path $repoRoot "ai-service\.venv\Scripts\python.exe"
if (Test-Path $venvPython) {
    & $venvPython -c "import fastapi, uvicorn, pydantic, torch, numpy" *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[0/3] Existing AI virtual environment is broken or incomplete. Recreating..."
        Remove-Item -Recurse -Force (Join-Path $repoRoot "ai-service\.venv")
    }
}

if (-not (Test-Path $venvPython)) {
    Write-Host "[0/3] Creating Python virtual environment..."
    Invoke-Expression "$python -m venv ai-service\.venv"
    & $venvPython -m pip install --upgrade pip
    & $venvPython -m pip install -r ai-service\requirements.txt
}

if (-not $env:ADMIN_EMAIL) {
    Write-Host "Missing ADMIN_EMAIL environment variable."
    exit 1
}
if (-not $env:ADMIN_PASSWORD) {
    Write-Host "Missing ADMIN_PASSWORD environment variable."
    exit 1
}
if (-not $env:SPRING_DATASOURCE_URL) {
    Write-Host "Missing SPRING_DATASOURCE_URL environment variable."
    exit 1
}
if (-not $env:SPRING_DATASOURCE_USERNAME) {
    Write-Host "Missing SPRING_DATASOURCE_USERNAME environment variable."
    exit 1
}
if (-not $env:SPRING_DATASOURCE_PASSWORD) {
    Write-Host "Missing SPRING_DATASOURCE_PASSWORD environment variable."
    exit 1
}
Start-Process powershell -WindowStyle Normal -ArgumentList "-NoExit", "-Command", "Set-Location '$repoRoot\ai-service'; .\.venv\Scripts\python.exe -m uvicorn service:app --host 127.0.0.1 --port 9000"
Start-Process powershell -WindowStyle Normal -ArgumentList "-NoExit", "-Command", "Set-Location '$repoRoot\backend'; .\mvnw.cmd spring-boot:run"
Start-Process powershell -WindowStyle Normal -ArgumentList "-NoExit", "-Command", "Set-Location '$repoRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "CampusNote Pro is starting:"
Write-Host "- AI Service: http://127.0.0.1:9000/docs"
Write-Host "- Spring Boot: http://localhost:8080/actuator/health"
Write-Host "- Frontend: use the Vite Local URL printed in the frontend terminal"
