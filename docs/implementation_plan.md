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
| **Auth** | FR-ST-04 | Password Reset | ✅ Completed | Forgot/reset password services, pages, and token tests implemented. |
| **Dash** | FR-ST-06/07| Dept/Year on Nav | ✅ Completed | Displayed dynamically in Header, Sidebar, and MobileNav. |
| **Profile**| FR-ST-10 | Aggregated Downloads| ✅ Completed | Total downloads aggregated and displayed in ProfilePage StatCard. |
| **Profile**| FR-ST-13 | Aggregated Likes | ✅ Completed | Total likes aggregated and displayed in ProfilePage StatCard. |
| **AI** | FR-ST-30 | AI Status Notification| ✅ Completed | Notifications triggered for UNDER REVIEW, PUBLISHED, FLAGGED, and REJECTED status changes. |
| **Search** | FR-ST-41/42| Search Filter/Sort | ✅ Completed | Backend-supported search query, faculty filtering, and downloads sorting. |
| **Preview**| FR-ST-43 | PDF Thumbnail | ✅ Completed | Actual first-page PDF thumbnail rendering and caching via PDFBox. |
| **Admin** | FR-ST-53 | Flagged Total Count | ✅ Completed | Provided by backend stats API and displayed on Admin Panel overview. |
| **Admin** | FR-ST-57 | Auto-flagging (5 rpts)| ✅ Completed | Automatically transitions status to FLAGGED when report count >= 5. |
| **Admin** | FR-ST-62 | Admin Logs UI | ✅ Completed | Admin Panel UI added to view chronological audit logs list from database. |
| **Admin** | FR-ST-63 | Storage Consumption | ✅ Completed | Total stored file size summed and displayed on Admin Panel overview. |
| **Tech** | CON-TECH-77| AWS S3 Storage | ⚠️ Mocked | Backend uses `mock_path` (acceptable for prototype scope). |

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
