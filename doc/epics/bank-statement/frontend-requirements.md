# Finance Reconciliation Frontend Requirements

Scope: io.aaden.cloud.domain.cloud.finance.reconciliation.*

Purpose: Define the UI/UX and client integration requirements for implementing the reconciliation module frontend based on context.md and the implemented API in api.md.

Notes and Constraints
- Only GET and POST methods are used for all API calls.
- All dates use ISO-8601 formats (e.g., 2025-01-31).
- File uploads use multipart/form-data with exact part names as specified.
- Responses are DTOs only; do not assume Map responses.
- Backend has CORS enabled (@CrossOrigin on controllers).

High-level Business Flow
1) Company management: Users create/update a company, optionally managing multiple department heads per company, with notes.
2) Reconciliation accounts: Users add/manage bank accounts for each company.
3) Bank statements: Users upload a bank statement PDF for an account with a known date range; the system stores it and triggers AI parsing. If date ranges overlap, the new statement replaces overlapping existing statements and their transactions.
4) Transactions: Each parsed transaction includes details (name, description, date, amount, type, tag, expense subtype for outcomes, optional department head). Users can attach supporting files, mark as submitted, and bulk upload attachments for an entire statement; the system will auto-match.

Target User Flows and Screens
1) Companies List and Save
- Route: /recon/companies
- UI:
  - List of companies (table or cards): name, notes, created time, department head count.
  - “Create Company” button opens a modal/form.
  - Company form fields:
    - name (required)
    - notes (optional)
    - department heads: dynamic rows with name (required) and notes (optional)
  - Edit action: opens the same form prefilled (save acts as update if id is present).
- API Integration:
  - GET /recon/company/list → List<CompanyDTO>
  - POST /recon/company/save with CompanySaveDTO → CompanyDTO
- Validation:
  - name: required, 1–100 chars
  - department heads: at least 0 items; each item name required, 1–100 chars
- UX States:
  - Loading and empty states for company list
  - Success/error toasts for save

2) Company Details: Accounts Management
- Route: /recon/company/:companyId/accounts
- UI:
  - Header shows company name, notes.
  - Accounts table: bankName, accountNumber (mask middle digits), alias, created time.
  - “Add Account” button opens modal/form.
  - Account form fields:
    - bankName (required)
    - accountNumber (required)
    - alias (optional)
- API Integration:
  - GET /recon/account/list?companyId={companyId} → List<ReconciliationAccountDTO>
  - POST /recon/account/save with ReconciliationAccountSaveDTO → ReconciliationAccountDTO
- Validation:
  - bankName: required, 1–100 chars
  - accountNumber: required, 6–34 chars (client validation; exact format not enforced by API)
  - alias: 0–100 chars
- UX States:
  - Loading and empty states for account list
  - Success/error toasts for save

3) Account Details: Statements List and Upload
- Route: /recon/account/:accountId/statements
- UI:
  - Statement list: name, description, date range (startDate–endDate), parsed flag, fileUrl (download link), created time.
  - “Upload Statement” button opens upload form.
  - Upload form fields and controls:
    - description (optional)
    - file (required; single PDF)
  - After upload, show info alert:
    - Parsing triggered. Overlapping existing statements (same account) will be replaced in the overlap range.
- API Integration:
  - GET /recon/statement/list?accountId={accountId} → List<BankStatementDTO>
  - POST multipart /recon/statement/upload with fields: accountId, description? and part file → BankStatementDTO
- Validation:
  - file: required, PDF only, size limit (UI-set, e.g., 20–50MB)
- UX States:
  - Loading/empty states for list
  - Progress indicator during upload
  - On success, refresh list; show parsed flag if available
  - Note: Statement name and date range are generated/derived by backend AI; client must not send them.

4) Statement Details: Transactions List
- Route: /recon/statement/:statementId/transactions
- UI:
  - Filter/search controls (client-side):
    - transactionType (INCOME/OUTCOME)
    - date range (subset of statement)
    - submissionStatus filter
    - text search (name, description, tag)
  - Transactions table columns:
    - date (LocalDate)
    - name
    - description
    - amount (positive green for income, negative red for outcome)
    - transactionType
    - expenseType (for OUTCOME: PRODUCTION/MANAGEMENT; blank for INCOME)
    - tag
    - departmentHead (name)
    - submissionStatus (badge)
    - attachment: fileName (linked to fileUrl if present)
    - actions: upload attachment, save attachment (by URL), view/download
- API Integration:
  - GET /recon/transaction/list?statementId={statementId} → List<BankTransactionDTO>
- UX States:
  - Loading/empty states
  - Sticky header with summary: totals by type (computed client-side)

5) Transaction Attachment: Single Upload
- Trigger: Row action “Upload Attachment”
- UI:
  - File picker dialog for a single file (pdf/jpg/png allowed; size limits e.g., up to 20–50MB)
  - Show a spinner and disable actions during upload.
- API Integration:
  - POST multipart /recon/transaction/upload-attachment with fields: transactionId and part file → BankTransactionDTO
- Behavior:
  - On success, the returned transaction has fileUrl/fileName updated and submissionStatus set to SUBMITTED. Update the table row.
  - On failure, show error and keep previous row state.

6) Transaction Attachment: Save by URL/Name
- Trigger: Row action “Save Attachment Link”
- UI:
  - Form with inputs: fileUrl (optional), fileName (optional)
  - Clarify that submissionStatus becomes SUBMITTED if fileUrl is present after save; otherwise it remains or becomes WAITING (unless set to NOT_REQUIRED/INVALID_CONTENT by business rules).
- API Integration:
  - POST /recon/transaction/save-attachment with params: transactionId, fileUrl?, fileName? → BankTransactionDTO
- Behavior:
  - Update the table row with returned values.

7) Batch Upload Attachments for a Statement
- Route/Trigger: On the statement transactions page, an action “Batch Upload Attachments”
- UI:
  - Multi-file picker (drag-and-drop area) with list of pending files and sizes.
  - Upload progress per file and overall.
  - After upload completes, show a summary:
    - attachedCount
    - unmatchedFiles: display as a list, with option to download or retry mapping later.
- API Integration:
  - POST multipart /recon/transaction/batch-upload-attachments with fields: statementId and part files (List<MultipartFile> under key "files") → TransactionBatchUploadResultDTO
- Behavior:
  - Refresh transactions list to reflect any new submissionStatus changes and attachments.

Data Models (DTOs)
- CompanyDTO
  - id: Long
  - name: String
  - departmentHeads: List<DepartmentHeadDTO>
    - id: Long
    - name: String
    - notes: String?
    - companyId: Long
    - createTimestamp: LocalDateTime?
  - notes: String?
  - createTimestamp: LocalDateTime?
- ReconciliationAccountDTO
  - id: Long
  - companyId: Long
  - bankName: String
  - accountNumber: String
  - alias: String?
  - createTimestamp: LocalDateTime?
- BankStatementDTO
  - id: Long
  - accountId: Long
  - name: String
  - description: String?
  - startDate: LocalDate
  - endDate: LocalDate
  - fileUrl: String
  - parsed: Boolean
  - createTimestamp: LocalDateTime?
- BankTransactionDTO
  - id: Long
  - statementId: Long
  - name: String
  - description: String?
  - date: LocalDate
  - amount: BigDecimal (income positive, expense negative)
  - transactionType: INCOME | OUTCOME
  - tag: String?
  - submissionStatus: SubmissionStatus (WAITING | NOT_REQUIRED | INVALID_CONTENT | SUBMITTED)
  - fileUrl: String?
  - fileName: String?
  - expenseType: PRODUCTION | MANAGEMENT | null (only for OUTCOME)
  - departmentHead: TransactionDepartmentHeadDTO? { id: Long, name: String }
  - createTimestamp: LocalDateTime?
- TransactionBatchUploadResultDTO
  - attachedCount: Int
  - unmatchedFiles: List<String>

API Contracts and Payloads
- Company Save (create/update)
  - POST /recon/company/save
  - Body: CompanySaveDTO
    - id?: Long (include to update)
    - name: String (required)
    - departmentHeads?: List<DepartmentHeadSaveDTO>
      - id?: Long
      - name: String (required)
      - notes?: String
    - notes?: String
  - Response: CompanyDTO
- Company List
  - GET /recon/company/list → List<CompanyDTO>
- Account Save (create/update)
  - POST /recon/account/save
  - Body: ReconciliationAccountSaveDTO
    - id?: Long
    - companyId: Long (required)
    - bankName: String (required)
    - accountNumber: String (required)
    - alias?: String
  - Response: ReconciliationAccountDTO
- Account List
  - GET /recon/account/list?companyId=Long → List<ReconciliationAccountDTO>
- Statement List
  - GET /recon/statement/list?accountId=Long → List<BankStatementDTO>
- Statement Upload
  - POST multipart /recon/statement/upload
    - Fields: accountId, description?
    - Part: file (single PDF)
  - Response: BankStatementDTO
- Transaction List
  - GET /recon/transaction/list?statementId=Long → List<BankTransactionDTO>
- Transaction Attachment Upload
  - POST multipart /recon/transaction/upload-attachment
    - Fields: transactionId
    - Part: file (single)
  - Response: BankTransactionDTO
- Transaction Attachment Save by URL
  - POST /recon/transaction/save-attachment
    - Params: transactionId, fileUrl?, fileName?
  - Response: BankTransactionDTO
- Batch Attachment Upload
  - POST multipart /recon/transaction/batch-upload-attachments
    - Fields: statementId
    - Parts: files (array)
  - Response: TransactionBatchUploadResultDTO

Client-side Validation and Formatting
- Dates: ISO-8601 strings; display localized but send ISO.
- Amount: currency format in UI; do not transform sign (server expects positive for income, negative for outcome already present in DTO).
- File Types:
  - Statement upload: PDF only.
  - Transaction attachments: PDF/JPG/PNG commonly allowed; validate by MIME type and extension.
- File Sizes: enforce sane limits (e.g., 20–50MB) with user feedback.
- Required fields: visual indicators and inline error messages.

Edge Cases and Behaviors
- Overlapping statements: Frontend does not resolve; inform users on upload form that overlap will replace existing data.
- Parsing delay: parsed flag may initially be false; show non-blocking status and allow manual refresh.
- Department head selection on transactions: read-only in current API; not editable via frontend unless endpoints are added.
- Network failures: retry affordances for idempotent GETs; present actionable error messages for POST failures.
- Empty states: provide guidance copy and CTAs to next action (e.g., upload a statement, add an account).

Security and UX
- CORS enabled on backend; standard browser fetch is sufficient.
- Authentication/authorization is outside this scope; integrate with existing app auth shell if present.
- Use optimistic UI updates only after successful responses; otherwise keep current state.

Navigation Summary
- /recon/companies → Companies list and save
- /recon/company/:companyId/accounts → Accounts for a company
- /recon/account/:accountId/statements → Statements list and upload
- /recon/statement/:statementId/transactions → Transactions list, single and batch attachment actions

Internationalization
- Labels should be i18n-enabled; Chinese copy may mirror context.md domain language if the product locale is zh-CN.

Telemetry and Logging
- Log API errors with endpoint and payload summary (no PII in logs).
- Track key actions: company saved, account saved, statement uploaded, attachment uploaded, batch upload result.

Performance Considerations
- Paginate or virtualize lists if they grow large (API does not provide pagination; implement client-side as needed).
- Cache data per route to avoid redundant GETs; invalidate on successful POSTs.

Readiness Checklist
- All routes implemented and reachable via app navigation.
- Forms for company/account/statement creation with validations.
- Transaction list with filters and attachment actions.
- Single and batch upload flows function with server responses.
- Clear loading, empty, success, error states.
