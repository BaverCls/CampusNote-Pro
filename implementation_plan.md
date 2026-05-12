# CampusNote-Pro SaaS Prototype Analysis & Implementation Plan

## 1. Project Analysis Summary

The current prototype follows a **3-tier architecture** with a **Java Spring Boot** backend and a **Vite/React/Tailwind** frontend. It implements most core features but has several gaps in specific functional requirements and minor UI bugs.

### Architectural Alignment
- **Client-Server**: Implemented via REST API.
- **3-Tier**: Backend, Frontend, and PostgreSQL database.
- **MVC/Layered**: Well-structured backend (Controllers -> Services -> Repositories).
- **RESTful API**: Usage is consistent.
- **Cloud Deployment**: Architecture supports it, though current storage is mock-based.

### Requirements Gap Analysis

| Category | Req ID | Description | Status | Note |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | FR-ST-04 | Password Reset | ❌ Missing | No backend endpoint or frontend UI. |
| **Dash** | FR-ST-06/07| Dept/Year on Nav | ❌ Missing | Not displayed in Header or Sidebar. |
| **Profile**| FR-ST-10 | Aggregated Downloads| ⚠️ Bugged | Frontend uses published count instead of download sum. |
| **Profile**| FR-ST-13 | Aggregated Likes | ❌ Missing | Not calculated on profile. |
| **AI** | FR-ST-30 | AI Status Notification| ❌ Missing | No notification trigger for uploader. |
| **Search** | FR-ST-41/42| Search Filter/Sort | ⚠️ Client-only| Implemented in React; should be supported by Backend. |
| **Preview**| FR-ST-43 | PDF Thumbnail | ⚠️ Generic | Uses icon instead of actual first-page preview. |
| **Admin** | FR-ST-53 | Flagged Total Count | ⚠️ Client-only| Should be explicitly provided by backend dashboard API. |
| **Admin** | FR-ST-57 | Auto-flagging (5 rpts)| ❌ Missing | Logic for report counting and status change missing. |
| **Admin** | FR-ST-62 | Admin Logs UI | ❌ Missing | Backend exists, but no UI to view logs. |
| **Admin** | FR-ST-63 | Storage Consumption | ⚠️ Hardcoded | UI displays static 0.5GB. |
| **Tech** | CON-TECH-77| AWS S3 Storage | ⚠️ Mocked | Backend uses `mock_path`. |

---

## 2. Proposed Changes

### Backend (Java Spring Boot)

#### [MODIFY] [DocumentService.java](file:///c:/FirstSaaSPrototype/CampusNote-Pro/backend/src/main/java/campusnote/backend/CoreDocumentManagement/DocumentService.java)
- Implement aggregated download and like counting.
- Implement search filtering by faculty and sorting by downloads.
- Add auto-flagging logic when reports reach threshold.

#### [MODIFY] [AdminController.java](file:///c:/FirstSaaSPrototype/CampusNote-Pro/backend/src/main/java/campusnote/backend/CoreSecurity/AdminController.java)
- Add endpoint for system statistics (Flagged count, Storage consumption).
- Ensure audit logs are fully captured for all admin actions.

#### [NEW] [PasswordResetController.java](file:///c:/FirstSaaSPrototype/CampusNote-Pro/backend/src/main/java/campusnote/backend/CoreSecurity/PasswordResetController.java)
- Handle reset token generation and verification.

### Frontend (React/Vite)

#### [MODIFY] [Sidebar.tsx](file:///c:/FirstSaaSPrototype/CampusNote-Pro/frontend/src/app/components/Sidebar.tsx) & [Header.tsx](file:///c:/FirstSaaSPrototype/CampusNote-Pro/frontend/src/app/components/Header.tsx)
- Update to display user's Department (FR-ST-06) and Academic Year (FR-ST-07).

#### [MODIFY] [ProfilePage.tsx](file:///c:/FirstSaaSPrototype/CampusNote-Pro/frontend/src/app/components/ProfilePage.tsx)
- Fix aggregated statistics calculation (Downloads and Likes).

#### [MODIFY] [AdminPanel.tsx](file:///c:/FirstSaaSPrototype/CampusNote-Pro/frontend/src/app/components/AdminPanel.tsx)
- Connect storage usage and flagged counts to backend.
- Add "Audit Logs" tab to view administrative history.

#### [NEW] [PasswordReset.tsx](file:///c:/FirstSaaSPrototype/CampusNote-Pro/frontend/src/app/components/PasswordReset.tsx)
- UI for requesting and performing password resets.

---

## 3. Verification Plan

### Automated Tests
- Run `mvn test` to verify backend logic.
- Verify AI Ranking status transitions via Postman/CURL.

### Manual Verification
1. **Auth Flow**: Register with `@arel.edu.tr`, test login, test password reset link.
2. **Dashboard**: Check if Department and Year appear correctly in the nav.
3. **Profile**: Upload a doc, like/download it, and verify the total counts update.
4. **Admin**: Flag a document, verify it appears in the moderation queue, and check if audit logs capture the dismissal/deletion.
5. **UI**: Toggle dark mode and verify consistent rendering across all pages.
