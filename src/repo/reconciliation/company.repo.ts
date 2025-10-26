import axios from 'axios'
import type { CompanyDTO, CompanySaveDTO } from './types'
import { baseUrl } from "@/store/aaden/cloud-v2-api"

// API base path for reconciliation company endpoints
const BASE = baseUrl.replace(/\/$/, '')

export async function listCompanies(): Promise<CompanyDTO[]> {
  const res = await axios.get<CompanyDTO[]>(`${BASE}/recon/company/list`)
  return res.data
}

export async function saveCompany(dto: CompanySaveDTO): Promise<CompanyDTO> {
  const res = await axios.post<CompanyDTO>(`${BASE}/recon/company/save`, dto)
  return res.data
}

