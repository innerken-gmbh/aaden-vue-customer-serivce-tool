// Reconciliation domain DTO types
// Dates are ISO strings

export interface DepartmentHeadDTO {
  id: number
  name: string
  notes?: string | null
  companyId: number
  createTimestamp?: string | null
}

export interface CompanyDTO {
  id: number
  name: string
  departmentHeads: DepartmentHeadDTO[]
  notes?: string | null
  createTimestamp?: string | null
}

export interface DepartmentHeadSaveDTO {
  id?: number
  name: string
  notes?: string | null
}

export interface CompanySaveDTO {
  id?: number
  name: string
  departmentHeads?: DepartmentHeadSaveDTO[]
  notes?: string | null
}

export interface ReconciliationAccountDTO {
  id: number
  companyId: number
  bankName: string
  accountNumber: string
  alias?: string | null
  createTimestamp?: string | null
}

export interface ReconciliationAccountSaveDTO {
  id?: number
  companyId: number
  bankName: string
  accountNumber: string
  alias?: string | null
}

export interface BankStatementDTO {
  id: number
  accountId: number
  name: string
  description?: string | null
  startDate: string // ISO LocalDate
  endDate: string   // ISO LocalDate
  fileUrl: string
  parsed: boolean
  createTimestamp?: string | null
}

export type TransactionType = 'INCOME' | 'OUTCOME'
export type ExpenseType = 'PRODUCTION' | 'MANAGEMENT' | null

export interface TransactionDepartmentHeadDTO {
  id: number
  name: string
}

export interface TransactionAccountDTO {
  id: number
  bankName: string
  accountNumber: string
  alias?: string | null
}

export type SubmissionStatus = 'WAITING' | 'NOT_REQUIRED' | 'INVALID_CONTENT' | 'SUBMITTED'

export interface BankTransactionDTO {
  id: number
  statementId: number
  account?: TransactionAccountDTO | null
  name: string
  description?: string | null
  date: string // ISO LocalDate
  amount: number
  transactionType: TransactionType
  tag?: string | null
  submissionStatus: SubmissionStatus
  fileUrl?: string | null
  fileName?: string | null
  expenseType: ExpenseType
  departmentHead?: TransactionDepartmentHeadDTO | null
  categoryNote?: string | null
  createTimestamp?: string | null
}

export interface BankTransactionSaveDTO {
  id?: number | null
  statementId: number
  name: string
  description?: string | null
  date: string // ISO LocalDate (YYYY-MM-DD)
  amount: number
  transactionType: TransactionType
  tag?: string | null
  expenseType?: ExpenseType
  departmentHeadId?: number | null
  submissionStatus?: SubmissionStatus | null
  fileUrl?: string | null
  fileName?: string | null
  categoryNote?: string | null
}

export interface TransactionAttachmentAIPreviewItemDTO {
  fileUrl: string
  title?: string | null
  amount?: number | null
  account?: string | null
  date?: string | null // ISO LocalDate
  validBill: boolean
  matchedTransactionId?: number | null
  matchedStatementId?: number | null
  categoryNote?: string | null
}

export interface TransactionAttachmentAIPreviewResponseDTO {
  items: TransactionAttachmentAIPreviewItemDTO[]
}

export interface ApplyAttachmentsItemDTO {
  transactionId: number
  fileUrl: string
  fileName?: string | null
    categoryNote?: string | null
}

export interface ApplyAttachmentsRequestDTO {
  items: ApplyAttachmentsItemDTO[]
}

export interface ApplyAttachmentsResponseDTO {
  items: BankTransactionDTO[]
}
