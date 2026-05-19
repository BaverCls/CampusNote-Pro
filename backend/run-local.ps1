$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
    [Environment]::SetEnvironmentVariable($Matches[1].Trim(), $Matches[2].Trim(), 'Process')
  }
}

.\mvnw.cmd spring-boot:run
