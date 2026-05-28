# Final Presentation Script

Target length: 10-15 minutes.

## 1. Opening: What CampusNote Pro Solves (1 minute)

CampusNote Pro is a SaaS academic note platform. The problem is not only uploading notes; the real problem is trust. Students need searchable course material, and administrators need quality control. Our solution connects authentication, PDF storage, Liaison AI review, publication, rewards, reporting, and admin moderation.

## 2. Work Products and Directory Structure (1 minute)

Show the root project structure:

```text
backend/
frontend/
docs/
CampusNotePro_Traceability_UseCaseConsistent.xlsx
```

Then show the separation:

- Functional requirements and business logic: controllers, services, repositories, frontend components.
- Non-functional requirements: storage telemetry, timing notes, deployment/configuration evidence.
- Tests: unit tests, controller/API tests, and Cucumber BDD features.
- Documents: proposal, architecture, implementation summary, traceability, presentation evidence.

## 3. Requirements to Modeling to Code (2 minutes)

Use the traceability workbook, not a crowded slide. Explain:

1. User story comes first.
2. Use case connects the user goal to system behavior.
3. BDD scenario writes the expected behavior.
4. Backend and frontend implementation show packages/classes.
5. Tests prove the requirement.

Highlight two rows:

- PDF upload/storage.
- Liaison AI scoring and publish/flag decision.

## 4. Architecture (1 minute)

CampusNote Pro uses a 3-tier architecture:

- React/Vite frontend.
- Spring Boot REST backend.
- JPA persistence layer configured for PostgreSQL/Supabase, with H2 used for automated tests.

Mention local PDF storage as the prototype substitute for production S3 and explain that it is documented as a constraint.

## 5. Key Functions Demo: 10-15 Functions, Not All 30 (3 minutes)

Fast walkthrough:

1. Register/login.
2. Upload PDF.
3. Reject invalid non-PDF.
4. Liaison AI review (utilizing a PyTorch AI microservice with local fallback).
5. Publish if score passes.
6. Flag if score fails.
7. Notification after status change.
8. CampusCoin reward.
9. Search/filter/sort.
10. Thumbnail preview.
11. Like/download counters.
12. Report and auto-flag.
13. Admin review.
14. Storage telemetry.
15. Password reset/audit logs if time allows.

## 6. BDD/TDD Demonstration (3 minutes)

Show one function deeply instead of many shallowly.

### Function 1: PDF upload/storage

1. Show `document_upload.feature`.
2. Explain positive scenario: valid PDF is accepted and stored.
3. Explain negative scenario: `.txt` upload is rejected and no metadata is saved.
4. Show `DocumentControllerTest`.
5. Show red-green evidence:
   - Failing Cucumber/controller test first.
   - Minimal implementation.
   - Passing output: `5 Scenarios (5 passed)`, `30 tests`, `BUILD SUCCESS`.

### Function 2: Liaison AI scoring

1. Show `liaison_ai.feature` (including the new PyTorch BDD scenario).
2. Positive: CS101 text with academic keywords reaches publish threshold.
3. Negative: irrelevant text stays below threshold.
4. Python PyTorch AI Integration: Explain that Liaison AI integrates with a Python FastAPI microservice executing a deterministic Multi-Layer Perceptron (MLP) PyTorch neural network to evaluate academic notes.
5. Fallback Mechanism: Emphasize that if the Python service is offline, the backend gracefully falls back to local keyword scoring.
6. Connect to `LiaisonService.triggerEvaluation`, `LiaisonService.callPyTorchAiService`, and `DocumentService.finalizeAIRanking`.


## 7. Non-Functional Requirements (1 minute)

Be honest and easy to scan:

- Storage: local prototype storage plus storage telemetry.
- Performance: document as a measured/future verification area for PDF preview, search, and AI throughput.
- Security: password hashing and session/auth tests.
- Deployment: show config and deployment notes.

## 8. Closing (30 seconds)

Close with traceability: every selected function is connected from requirement to use case to BDD scenario to implementation class to automated test. The goal is not to show every button; the goal is to prove the engineering process is complete and repeatable.
