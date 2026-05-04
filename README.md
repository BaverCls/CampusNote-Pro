# CampusNote Pro

CampusNote Pro is a comprehensive academic document management platform featuring an integrated AI evaluation system (Liaison AI) and a real-time status tracking dashboard.

## Project Structure

- `backend/`: Spring Boot application handling core logic, document management, and AI service integration.
- `frontend/`: Vite-powered React application with a modern UI and offline-first state management.

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
1. Navigate to the `backend` directory.
2. Update `src/main/resources/application.properties` with your database credentials.
3. Run the application:
   ```bash
   ./mvnw spring-boot:run
   ```

### 2. Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Key Features
- **Document Management**: Upload, list, and review academic documents.
- **Liaison AI**: Automated AI-driven evaluation of submitted documents.
- **Status Tracker**: Real-time visualization of submission and evaluation lifecycle.
- **Offline-First**: Robust state management using local storage to ensure UI consistency during network fluctuations.
