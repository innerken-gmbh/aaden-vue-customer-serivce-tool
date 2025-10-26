import axios from 'axios'
import type { ReconciliationAccountDTO, ReconciliationAccountSaveDTO } from './types'
import { baseUrl } from '@/store/aaden/cloud-v2-api'

const BASE = baseUrl.replace(/\/$/, '')

export async function listAccounts(companyId: number): Promise<ReconciliationAccountDTO[]> {
  const res = await axios.get<ReconciliationAccountDTO[]>(`${BASE}/recon/account/list`, { params: { companyId } })
  return res.data
}

export async function saveAccount(dto: ReconciliationAccountSaveDTO): Promise<ReconciliationAccountDTO> {
  const res = await axios.post<ReconciliationAccountDTO>(`${BASE}/recon/account/save`, dto)
  return res.data
}
