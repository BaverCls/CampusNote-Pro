# BDD/TDD Evidence Index

## Current Automated Evidence

Latest backend verification:

```text
Tests run: 30, Failures: 0, Errors: 0, Skipped: 0
5 Scenarios (5 passed)
21 Steps (21 passed)
BUILD SUCCESS
```

## BDD Scenarios

| Feature | Requirement focus | Positive scenario | Negative scenario | File |
|---|---|---|---|---|
| PDF upload and storage | PDF-only upload, storage path, metadata creation | Store a valid PDF for AI review | Reject a non-PDF upload before storage | `backend/src/test/resources/features/document_upload.feature` |
| Liaison AI scoring | AI relevance scoring and publication threshold | CS101 academic text gets publishable score | Irrelevant text gets below-threshold score | `backend/src/test/resources/features/liaison_ai.feature` |
| Liaison PyTorch AI | Integrating real Python PyTorch AI microservice | Liaison AI uses PyTorch model for scoring | Falls back to local keyword scoring if unavailable | `backend/src/test/resources/features/liaison_ai.feature` |
| CampusCoin rewards | Reward accepted documents by AKTS | Published document awards coins | Covered through below-threshold AI/unit tests | `backend/src/test/resources/features/rewards.feature` |

## TDD / API-Level Tests

| Test file | What it proves | Test-first screenshot to capture |
|---|---|---|
| `DocumentControllerTest.java` | Upload API stores valid PDFs under configured directory and rejects non-PDF files before metadata save | Run with assertion/implementation missing, show failure, then show green |
| `DocumentServiceTest.java` | AI finalization publishes or flags documents, awards coins, sends notifications, and sums storage bytes | Show threshold failure or storage bytes test before implementation |
| `LiaisonServiceTest.java` | Liaison AI moves document to UNDER REVIEW, sends notification, and queries Python PyTorch service (with local fallback if down) | Show success response score mapped, and service down fallback |
| `test_service.py` | PyTorch document quality model evaluation on positive, negative, and schema checks | Verify FastAPI POST /evaluate endpoint returns valid schema and scores |
| `RunCucumberTest.java` | All BDD feature files are executable under Maven | Show Cucumber failing, then `6 Scenarios (6 passed)` |

## Recommended Screenshot Sequence

1. Open `document_upload.feature` and show the scenario written first.
2. Run `.\mvnw.cmd test` with the implementation temporarily incomplete or with the failing output already captured.
3. Show the red output: Cucumber scenario or controller test fails.
4. Show the minimal code added in `DocumentController.java` or `DocumentControllerTest.java`.
5. Run tests again and show `5 Scenarios (5 passed)` plus `Tests run: 30`.
6. Show the refactor: test names, step definitions, and traceability workbook row linking requirement to tests.

## Functions To Present End-To-End

| # | Function | Requirement / artifact | Implementation | Tests |
|---:|---|---|---|---|
| 1 | Student registration/login | FR-ST-01, FR-ST-02 | `AuthController`, `AuthService.ts` | `AuthControllerTest` |
| 2 | PDF upload validation | FR-ST-15 | `DocumentController.uploadDocument` | `DocumentControllerTest`, `document_upload.feature` |
| 3 | PDF local storage | CON-TECH-77 prototype evidence | `DocumentController.uploadDocument`, `DocumentService.uploadDocument` | `DocumentControllerTest`, `document_upload.feature` |
| 4 | Liaison AI scoring | FR-ST-25, FR-ST-26, FR-ST-27 | `LiaisonService` (calls FastAPI `ai-service`) | `liaison_ai.feature`, `LiaisonServiceTest`, `test_service.py` |
| 5 | Publish / flag decision | FR-ST-28, FR-ST-29 | `DocumentService.finalizeAIRanking` | `DocumentServiceTest` |
| 6 | AI status notifications | FR-ST-30 | `NotificationService`, `DocumentService` | `LiaisonServiceTest`, `DocumentServiceTest` |
| 7 | CampusCoin rewards | FR-ST-33, FR-ST-34 | `DocumentService.awardCoinsForDocument` | `rewards.feature`, `DocumentServiceTest` |
| 8 | Search and sorting | FR-ST-41, FR-ST-42 | `DocumentService.searchDocuments` | Manual/API demo |
| 9 | PDF preview thumbnail | FR-ST-43 | `DocumentController.thumbnail` | Manual/API demo |
| 10 | Like/download counters | FR-ST-37, FR-ST-39 | `DocumentService.toggleLike`, `incrementDownloadCount` | Manual/API demo |
| 11 | Report and auto-flag | FR-ST-57 | `DocumentService.reportDocument` | `DocumentServiceTest` |
| 12 | Admin review | FR-ST-52 to FR-ST-56 | `AdminController`, `DocumentService.reviewDocument` | `AdminControllerTest`, `DocumentServiceTest` |
| 13 | Storage telemetry | FR-ST-63 | `DocumentService.getTotalStoredBytes` | `DocumentServiceTest` |
| 14 | Password reset | FR-ST-04 | `AuthController` | `AuthControllerTest` |
| 15 | Audit logs | Admin/business logic | `AuditLog`, `AuditLogRepository`, `AdminController` | `AdminControllerTest` |

## Automated Verification Commands

### 1. Python PyTorch AI Microservice Tests
Run pytest from the `ai-service/` directory to verify the model predictions, confidence score scaling, and schema matches:
```bash
C:\Users\pelin\AppData\Local\Programs\Python\Python312\python.exe -m pytest
```

### 2. Spring Boot Backend & BDD Cucumber Tests
Run Maven from the `backend/` directory to verify the LiaisonService integration and BDD scenario execution:
```bash
cmd.exe /c mvnw.cmd clean test
```

