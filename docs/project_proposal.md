# CampusNote Pro Project Proposal

## 1. Project Summary

CampusNote Pro is a SaaS-style academic document management platform for Istanbul Arel University students and administrators. Students upload course PDFs, Liaison AI reviews academic relevance, accepted documents become public study material, and the platform tracks rewards, notifications, reports, moderation, and profile statistics.

## 2. Problem Statement

Students need a trusted, organized place to share course notes. Existing informal channels make it hard to verify document quality, find department-specific material, and moderate invalid or low-quality uploads. CampusNote Pro addresses this with controlled authentication, PDF-only upload, AI-supported quality review, searchable public documents, and administrator moderation.

## 3. Objectives

- Provide authenticated student access with university email constraints.
- Store and preview uploaded PDF documents.
- Evaluate uploaded notes with Liaison AI before publication.
- Reward accepted contributions with CampusCoins.
- Support searching, filtering, liking, downloading, reporting, and moderation.
- Demonstrate traceability from requirements to use cases, implementation, BDD scenarios, and tests.

## 4. Scope

### In Scope

- React/Vite frontend and Spring Boot backend.
- PDF upload, local prototype storage, PDF preview, download, and metadata tracking.
- Liaison AI keyword-based scoring for academic relevance.
- Admin threshold control, document review, reports, and storage telemetry.
- Automated unit, controller, and BDD tests.
- Final presentation, poster/video support, and traceability workbook.

### Out of Scope / Prototype Constraints

- Production AWS S3 storage is represented by local storage in this prototype.
- Production email delivery is represented by local reset-token flow.
- Full load/performance testing is documented as NFR evidence rather than production-scale benchmarking.

## 5. Stakeholders

| Stakeholder | Interest |
|---|---|
| Students | Upload, discover, like, download, and track academic notes |
| Admins | Review flagged documents, control AI threshold, monitor storage and audit logs |
| Instructor / Evaluator | Verify requirements coverage, architecture, BDD/TDD process, tests, and traceability |
| Project Team | Demonstrate complete software engineering lifecycle and implementation quality |

## 6. Methodology

The project follows a requirements-to-code workflow:

1. Identify functional requirements, non-functional requirements, and constraints.
2. Model use cases and architecture artifacts.
3. Implement backend services, repositories, controllers, and frontend screens.
4. Write BDD scenarios and TDD/API tests for representative functions.
5. Verify with Maven tests, frontend build, live demo, and traceability workbook.

## 7. Gantt Plan

| ID | Task | Start | End | Deliverable |
|---|---|---:|---:|---|
| 1 | Collect instructor feedback and grading criteria | 2026-05-28 | 2026-05-28 | Feedback checklist |
| 2 | Reorganize presentation scope to 10-15 key functions | 2026-05-28 | 2026-05-29 | Demo function list |
| 3 | Update project proposal | 2026-05-28 | 2026-05-29 | Proposal document |
| 4 | Clean Visual Paradigm / READ naming consistency | 2026-05-29 | 2026-05-30 | Aligned READ and VP exports |
| 5 | Split traceability workbook into focused tables | 2026-05-29 | 2026-05-30 | Traceability workbook |
| 6 | Add BDD scenarios for PDF upload/storage | 2026-05-28 | 2026-05-28 | `document_upload.feature` |
| 7 | Add BDD scenarios for Liaison AI scoring | 2026-05-28 | 2026-05-28 | `liaison_ai.feature` |
| 8 | Add API/controller tests for PDF positive path | 2026-05-28 | 2026-05-28 | `DocumentControllerTest` |
| 9 | Add API/controller tests for invalid upload negative path | 2026-05-28 | 2026-05-28 | `DocumentControllerTest` |
| 10 | Fix executable Cucumber runner and step definitions | 2026-05-28 | 2026-05-28 | `RunCucumberTest` and steps |
| 11 | Capture failing BDD/TDD screenshot before fix | 2026-05-29 | 2026-05-29 | Screenshot evidence |
| 12 | Capture passing BDD/TDD screenshot after fix | 2026-05-29 | 2026-05-29 | Screenshot evidence |
| 13 | Capture refactor/test-green screenshot | 2026-05-29 | 2026-05-29 | Screenshot evidence |
| 14 | Update architecture section and diagrams | 2026-05-29 | 2026-05-31 | Architecture artifacts |
| 15 | Prepare API-level functional test evidence | 2026-05-30 | 2026-05-31 | Test outputs |
| 16 | Prepare NFR evidence notes for timing/storage constraints | 2026-05-30 | 2026-05-31 | NFR evidence table |
| 17 | Build presentation slide outline | 2026-05-31 | 2026-06-01 | Presentation script |
| 18 | Add screenshots of directory structure and packages/classes | 2026-05-31 | 2026-06-01 | Screenshot folder |
| 19 | Add live demo script and fallback screenshots | 2026-06-01 | 2026-06-01 | Demo script |
| 20 | Finalize poster and video outline | 2026-06-01 | 2026-06-02 | Poster/video assets |
| 21 | Run backend Maven test suite | 2026-06-02 | 2026-06-02 | Test result output |
| 22 | Run frontend build | 2026-06-02 | 2026-06-02 | Build output |
| 23 | Package deliverables with root evidence index | 2026-06-02 | 2026-06-03 | Final ZIP |
| 24 | Rehearse 10-15 minute presentation | 2026-06-03 | 2026-06-03 | Timed rehearsal |
| 25 | Final submission audit | 2026-06-03 | 2026-06-04 | Submission checklist |

## 8. Success Criteria

- Presentation clearly connects READ/requirements, Visual Paradigm models, implementation packages/classes, and tests.
- Traceability is split into easy-to-scan tables.
- At least two functions are shown with positive and negative BDD/TDD evidence.
- Maven test suite passes and Cucumber scenarios are visible in output.
- Demo focuses on 10-15 high-value functions instead of trying to show all functions.
