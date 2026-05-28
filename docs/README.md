# CampusNote Pro

CampusNote Pro is a comprehensive academic document management platform featuring an integrated AI evaluation system (Liaison AI) and a real-time status tracking dashboard.

## Project Structure

- `backend/`: Spring Boot application handling core logic, document management, and AI service integration.
- `frontend/`: Vite-powered React application with a modern UI and offline-first state management.
- `docs/project_proposal.md`: Updated proposal with scope, stakeholders, methodology, and a 25-task Gantt plan.
- `docs/bdd_tdd_evidence.md`: Grader-facing index for BDD/TDD evidence, screenshot sequence, and key functions.
- `docs/final_presentation_script.md`: 10-15 minute presentation script connecting documents, code, tests, and traceability.

## Requirements

### Backend
- **Java**: 17 or higher
- **Maven**: 3.9+
- **Database**: PostgreSQL (The project is configured to use Supabase PostgreSQL by default)

### Frontend
- **Node.js**: 18.x or higher
- **Package Manager**: npm or pnpm

## Getting Started

### 1. Backend Setup
The backend listens on `http://localhost:8081`. The port is set by
`backend/src/main/resources/application.properties` with `server.port=8081`.

The backend expects these environment variables at startup:
`SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`,
`SPRING_DATASOURCE_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and optionally
`FRONTEND_URL`. Spring Boot does not automatically load `backend/.env` for this
project, so load it into the current PowerShell process before starting Maven.

Windows PowerShell:
```powershell
cd backend
.\run-local.ps1
```

From the project root, the same command is:
```powershell
.\backend\run-local.ps1
```

macOS/Linux:
```bash
cd backend
set -a
. ./.env
set +a
./mvnw spring-boot:run
```

Expected startup line:
```text
Tomcat started on port 8081 (http)
```

### 2. Frontend Setup
1. Navigate to the `frontend` directory.
2. Confirm `frontend/.env.local` contains:
   ```text
   VITE_API_BASE_URL=http://localhost:8081
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

The frontend dev server uses `http://localhost:8000`.

### Local Development Checks

Backend health check:
```powershell
Invoke-WebRequest -Uri http://localhost:8081/actuator/health -UseBasicParsing
```

Login endpoint smoke test with intentionally invalid credentials:
```powershell
$body = @{ email = 'not-a-user@arel.edu.tr'; password = 'wrong-password' } | ConvertTo-Json
Invoke-WebRequest -Uri http://localhost:8081/api/auth/login -Method Post -ContentType 'application/json' -Body $body -UseBasicParsing
```

Expected result: HTTP `401` for invalid credentials. With valid credentials,
the endpoint should return HTTP `200`.

If port `8081` is already in use on Windows PowerShell:
```powershell
netstat -ano | findstr :8081
Get-Process -Id <PID>
Stop-Process -Id <PID> -Force
```

## Key Features
- **Document Management**: Upload, list, and review academic documents.
- **Liaison AI**: Automated AI-driven evaluation of submitted documents.
- **Status Tracker**: Real-time visualization of submission and evaluation lifecycle.
- **Offline-First**: Robust state management using local storage to ensure UI consistency during network fluctuations.
