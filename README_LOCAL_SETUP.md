# CampusNote Pro Local Setup

## Ports

- Backend: `http://localhost:8080`
- Frontend: `http://localhost:8000`
- Optional AI service: `http://127.0.0.1:9000/evaluate`

## Environment

Backend requires a local `.env` file. Do not commit secret values.

Required env names:

```env
DB_URL=
DB_USERNAME=
DB_PASSWORD=
JWT_SECRET=
R2_ENABLED=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_ENDPOINT=
R2_MAX_FILE_SIZE_MB=
```

`.env` and `.env.local` must not be committed.

## Run Backend

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

## Run Frontend

```powershell
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 8000
```

## Test

```powershell
cd backend
.\mvnw.cmd test
```

```powershell
cd frontend
npm run build
```
