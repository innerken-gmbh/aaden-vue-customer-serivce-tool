import axios from 'axios'
import type { BankTransactionDTO, TransactionAttachmentAIPreviewResponseDTO, ApplyAttachmentsRequestDTO, ApplyAttachmentsResponseDTO, BankTransactionSaveDTO } from './types'
import { baseUrl } from '@/store/aaden/cloud-v2-api'

const BASE = baseUrl.replace(/\/$/, '')

/**
 * List all transactions by company
 * GET /recon/transaction/list-by-company?companyId=xxx
 */
export async function listTransactionsByCompany(companyId: number): Promise<BankTransactionDTO[]> {
  const res = await axios.get<BankTransactionDTO[]>(`${BASE}/recon/transaction/list-by-company`, {
    params: { companyId },
  })
  return res.data
}

/**
 * List transactions by account
 * GET /recon/transaction/list-by-account?accountId=xxx
 */
export async function listTransactionsByAccount(accountId: number): Promise<BankTransactionDTO[]> {
  const res = await axios.get<BankTransactionDTO[]>(`${BASE}/recon/transaction/list-by-account`, {
    params: { accountId },
  })
  return res.data
}

/**
 * Create or update a transaction
 * POST /recon/transaction/save
 */
export async function saveTransaction(dto: BankTransactionSaveDTO): Promise<BankTransactionDTO> {
  const res = await axios.post<BankTransactionDTO>(`${BASE}/recon/transaction/save`, dto)
  return res.data
}

/**
 * Upload attachment for a single transaction
 * POST /recon/transaction/upload-attachment
 * form: { transactionId, file }
 */
export async function uploadTransactionAttachment(form: FormData): Promise<BankTransactionDTO> {
  const res = await axios.post<BankTransactionDTO>(`${BASE}/recon/transaction/upload-attachment`, form)
  return res.data
}

/**
 * Save attachment link for a transaction
 * POST /recon/transaction/save-attachment
 */
export async function saveTransactionAttachment(params: { transactionId: number; fileUrl?: string; fileName?: string }): Promise<BankTransactionDTO> {
  const res = await axios.post<BankTransactionDTO>(`${BASE}/recon/transaction/save-attachment`, params)
  return res.data
}

/**
 * Batch upload attachments for a statement (Step 1: AI analysis preview)
 * POST /recon/transaction/batch-upload-attachments
 * form: { statementId, files[] }
 */
export async function batchUploadAttachments(form: FormData): Promise<TransactionAttachmentAIPreviewResponseDTO> {
  const res = await axios.post<TransactionAttachmentAIPreviewResponseDTO>(`${BASE}/recon/transaction/batch-upload-attachments`, form)
  return res.data
}

/**
 * Apply attachments mapping (Step 2: persist)
 * POST /recon/transaction/apply-attachments
 */
export async function applyAttachments(dto: ApplyAttachmentsRequestDTO): Promise<ApplyAttachmentsResponseDTO> {
  const res = await axios.post<ApplyAttachmentsResponseDTO>(`${BASE}/recon/transaction/apply-attachments`, dto)
  return res.data
}
