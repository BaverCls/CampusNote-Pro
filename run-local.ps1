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

$env:SPRING_DATASOURCE_URL = "jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;MODE=PostgreSQL"
$env:SPRING_DATASOURCE_USERNAME = "sa"
$env:SPRING_DATASOURCE_PASSWORD = ""
$env:ADMIN_EMAIL = "admin@arel.edu.tr"
$env:ADMIN_PASSWORD = "admin123"

Start-Process powershell -WindowStyle Normal -ArgumentList "-NoExit", "-Command", "Set-Location '$repoRoot\ai-service'; .\.venv\Scripts\python.exe -m uvicorn service:app --host 127.0.0.1 --port 9000"
Start-Process powershell -WindowStyle Normal -ArgumentList "-NoExit", "-Command", "Set-Location '$repoRoot\backend'; `$env:SPRING_DATASOURCE_URL='$env:SPRING_DATASOURCE_URL'; `$env:SPRING_DATASOURCE_USERNAME='sa'; `$env:SPRING_DATASOURCE_PASSWORD=''; `$env:ADMIN_EMAIL='admin@arel.edu.tr'; `$env:ADMIN_PASSWORD='admin123'; .\mvnw.cmd spring-boot:run"
Start-Process powershell -WindowStyle Normal -ArgumentList "-NoExit", "-Command", "Set-Location '$repoRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "CampusNote Pro is starting:"
Write-Host "- AI Service: http://127.0.0.1:9000/docs"
Write-Host "- Spring Boot: http://localhost:8081/actuator/health"
Write-Host "- Frontend: http://localhost:5173"
