import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { useRoute } from 'vue-router'
import type { BankTransactionDTO, ReconciliationAccountDTO, BankTransactionSaveDTO, DepartmentHeadDTO, TransactionAttachmentAIPreviewResponseDTO, TransactionAttachmentAIPreviewItemDTO, ApplyAttachmentsRequestDTO } from '@/repo/reconciliation/types'
import { listTransactionsByAccount, uploadTransactionAttachment, saveTransactionAttachment, batchUploadAttachments, saveTransaction, applyAttachments } from '@/repo/reconciliation/transaction.repo'
import { listAccounts } from '@/repo/reconciliation/account.repo'
import { uploadStatement } from '@/repo/reconciliation/statement.repo'
import { listCompanies } from '@/repo/reconciliation/company.repo'

export const useReconTransactionsStore = defineStore('recon-transactions', {
  state: () => {
    const route = useRoute()
    const raw = Number(route.params.companyId)
    const cid = Number.isFinite(raw) && raw > 0 ? raw : 1
    return {
      companyId: cid as number,
      loading: false as boolean,
      list: [] as BankTransactionDTO[],
      accounts: [] as ReconciliationAccountDTO[],
      departmentHeads: [] as DepartmentHeadDTO[],
      filters: reactive({
        type: '' as '' | 'INCOME' | 'OUTCOME',
        submissionStatus: '' as '' | 'WAITING' | 'NOT_REQUIRED' | 'INVALID_CONTENT' | 'SUBMITTED',
        accountId: null as number | null,
        statementId: null as number | null,
        departmentHeadId: null as number | null,
        query: '',
        dateRange: null as [number, number] | null,
      }),
      // 上传对账单相关
      showUpload: false as boolean,
      form: reactive({
        accountId: null as number | null,
        description: '',
        file: null as File | null,
      }),
      rules: {} as Record<string, any>,
      uploading: false as boolean,
      batchStatementId: null as number | null,
      batchPreview: [] as (TransactionAttachmentAIPreviewItemDTO & { fileName?: string | null })[],
      applying: false as boolean,
    }
  },
  getters: {
    batchTransactionSelectOptions(state): { label: string; value: number }[] {
      if (!state.batchStatementId) return []
      const opts = (state.list || [])
        .filter(t => t.statementId === state.batchStatementId)
        .map(t => ({
          label: `#${t.id} ${t.date} ${t.name} · ${t.amount}`,
          value: t.id,
        }))
      return opts
    },
    accountSelectOptions(state): { label: string; value: number }[] {
      const mask = (no: string) => (no?.length > 8 ? `${no.slice(0, 4)} **** **** ${no.slice(-4)}` : no)
      return (state.accounts || []).map(a => ({
        label: `${a.bankName} ${mask(a.accountNumber)}${a.alias ? `（${a.alias}）` : ''}`,
        value: a.id,
      }))
    },
    statementSelectOptions(state): { label: string; value: number }[] {
      const ids = Array.from(new Set((state.list || []).map(t => t.statementId)))
      return ids.map(id => ({ label: `对账单 #${id}`, value: id }))
    },
    departmentHeadSelectOptions(state): { label: string; value: number }[] {
      return (state.departmentHeads || []).map(h => ({ label: h.name, value: h.id }))
    },
    filtered(state): BankTransactionDTO[] {
      return state.list.filter((t) => {
        if (state.filters.accountId && t.account?.id !== state.filters.accountId) return false
        if (state.filters.statementId && t.statementId !== state.filters.statementId) return false
        if (state.filters.type && t.transactionType !== state.filters.type) return false
        if (state.filters.submissionStatus) {
          if (t.submissionStatus !== state.filters.submissionStatus) return false
        }
        if (state.filters.departmentHeadId && (t.departmentHead?.id ?? null) !== state.filters.departmentHeadId) return false
        if (state.filters.dateRange && state.filters.dateRange.length === 2) {
          const [startTs, endTs] = state.filters.dateRange
          if (Number.isFinite(startTs) && Number.isFinite(endTs)) {
            const txTs = new Date(t.date + 'T00:00:00').getTime()
            if (txTs < startTs || txTs > endTs) return false
          }
        }
        if (state.filters.query) {
          const q = state.filters.query.trim().toLowerCase()
          const text = `${t.name} ${t.description ?? ''} ${t.note ?? ''}`.toLowerCase()
          // 支持按金额搜索：当输入为数字（允许包含逗号）时，匹配金额相等或包含
          const numRaw = q.replace(/,/g, '')
          const numVal = Number(numRaw)
          const byAmount = Number.isFinite(numVal)
            ? (Number(t.amount.toFixed(2)) === Number(numVal.toFixed ? numVal.toFixed(2) : numVal) ||
               String(t.amount).includes(numRaw) ||
               String(t.amount.toFixed(2)).includes(numRaw))
            : false
          if (!(text.includes(q) || byAmount)) return false
        }
        return true
      })
    },
    summary(): { income: number; outcome: number; total: number } {
      const income = this.filtered.filter(t => t.transactionType === 'INCOME').reduce((s, t) => s + t.amount, 0)
      const outcome = this.filtered.filter(t => t.transactionType === 'OUTCOME').reduce((s, t) => s + t.amount, 0)
      return { income, outcome, total: income + outcome }
    },
  },
  actions: {
    async loadDepartmentHeads() {
      try {
        const companies = await listCompanies()
        const me = companies.find(c => c.id === this.companyId)
        this.departmentHeads = me?.departmentHeads ?? []
      } catch (e) {
        this.departmentHeads = []
      }
    },
    async load() {
      this.loading = true
      try {
        if (!Number.isFinite(this.companyId) || this.companyId <= 0) {
          console.warn('[recon-transactions] Missing or invalid companyId in route query')
          this.list = []
          this.accounts = []
          return
        }
        // 先加载账户列表
        const accts = await listAccounts(this.companyId)
        this.accounts = accts
        if (!accts || accts.length === 0) {
          // 没有账户则无法查询流水
          this.filters.accountId = null
          this.list = []
          // 也尝试加载负责人列表，避免其他功能受影响
          await this.loadDepartmentHeads()
          return
        }
        // 从 localStorage 读取上次选择的账户（按公司隔离）
        const key = `recon.selectedAccount.${this.companyId}`
        let preferredId: number | null = null
        if (typeof window !== 'undefined') {
          const raw = window.localStorage.getItem(key)
          const num = raw != null ? Number(raw) : NaN
          if (Number.isFinite(num) && accts.some(a => a.id === num)) preferredId = num
        }
        // 确保 accountId 一定有值：
        // 1) 优先使用当前 state 中的选中值（且存在于账户列表）
        // 2) 其次使用本地持久化的值
        // 3) 否则回退到第一个账户
        const hasStateValue = Number.isFinite(this.filters.accountId as any) && accts.some(a => a.id === (this.filters.accountId as number))
        if (hasStateValue) {
          // 保持现有值
        } else if (preferredId != null) {
          this.filters.accountId = preferredId
        } else {
          this.filters.accountId = accts[0].id
        }
        // 加载负责人列表
        await this.loadDepartmentHeads()
        const txs = await listTransactionsByAccount(this.filters.accountId as number)
        this.list = txs
      } finally {
        this.loading = false
      }
    },
    async reloadByAccount(accountId: number) {
      if (!Number.isFinite(accountId)) return
      this.loading = true
      try {
        const txs = await listTransactionsByAccount(accountId)
        this.list = txs
      } finally {
        this.loading = false
      }
    },
    async openUpload() {
      // 确保账户列表已加载；若没有账户则给出提示并阻止打开弹窗
      try {
        if (!this.accounts || this.accounts.length === 0) {
          this.accounts = await listAccounts(this.companyId)
        }
      } catch (e) {
        // 网络错误时也继续走到提示
      }
      if (!this.accounts || this.accounts.length === 0) {
        // 无账户，提示用户先创建账户
        // 使用全局消息（由 naive-ui 在 main 中注入）
        window.$message?.warning?.('当前公司暂无账户，请先在“账户管理”中创建账户')
        return
      }
      // 预填充账户：若当前过滤选择了账户，则用于上传默认账户
      this.form.accountId = (this.filters.accountId as number) || null
      this.form.description = ''
      this.form.file = null
      this.showUpload = true
    },
    async submitUpload() {
      // 上传对账单并刷新列表（起止日期由后端 AI 自动识别）
      if (!this.form.accountId || !this.form.file) throw new Error('请完善上传信息')
      const fd = new FormData()
      fd.append('accountId', String(this.form.accountId))
      if (this.form.description) fd.append('description', this.form.description)
      fd.append('file', this.form.file as File)
      this.uploading = true
      try {
        await uploadStatement(fd)
        this.showUpload = false
        await this.load()
      } finally {
        this.uploading = false
      }
    },
    async uploadAttachment(transactionId: number, file: File) {
      const fd = new FormData()
      fd.append('transactionId', String(transactionId))
      fd.append('file', file)
      const updated = await uploadTransactionAttachment(fd)
      // 更新列表中的该条记录
      const idx = this.list.findIndex(t => t.id === updated.id)
      if (idx >= 0) this.list.splice(idx, 1, updated)
    },
    async saveAttachment(params: { transactionId: number; fileUrl?: string; fileName?: string }) {
      const updated = await saveTransactionAttachment(params)
      const idx = this.list.findIndex(t => t.id === updated.id)
      if (idx >= 0) this.list.splice(idx, 1, updated)
    },
    async batchUpload(files: File[]) {
      if (!this.batchStatementId) throw new Error('请先选择对账单')
      const fd = new FormData()
      fd.append('statementId', String(this.batchStatementId))
      files.forEach(f => fd.append('files', f))
      this.uploading = true
      try {
        const resp = await batchUploadAttachments(fd)
        this.batchPreview = (resp.items || []).map(it => ({ ...it, fileName: undefined }))
        if (!resp.items || resp.items.length === 0) {
          window.$message?.info?.('未识别到任何可用的票据，请检查文件内容或稍后重试')
        } else {
          const unmatched = resp.items.filter(i => !i.matchedTransactionId).length
          const invalid = resp.items.filter(i => i.validBill === false).length
          window.$message?.success?.(`分析完成：${resp.items.length} 个文件；未匹配 ${unmatched}；无效 ${invalid}`)
        }
      } finally {
        this.uploading = false
      }
    },
    async applyBatchAttachments() {
      // 构建确认后的映射，只提交已选择交易的项目
      const items = this.batchPreview
        .filter(it => Number.isFinite(it.matchedTransactionId as any))
        .map(it => ({
          transactionId: it.matchedTransactionId as number,
          fileUrl: it.fileUrl,
          fileName: it.fileName ?? undefined,
            categoryNote: it.categoryNote ?? undefined,
        }))
      if (items.length === 0) throw new Error('请先为至少一个文件选择对应的流水条目')
      this.applying = true
      try {
        const payload: ApplyAttachmentsRequestDTO = { items }
        const res = await applyAttachments(payload)
        const updated = res.items || []
        // 将返回的交易更新进列表
        updated.forEach(u => {
          const idx = this.list.findIndex(t => t.id === u.id)
          if (idx >= 0) this.list.splice(idx, 1, u)
          else this.list.unshift(u)
        })
        // 清空预览
        this.batchPreview = []
        window.$message?.success?.(`已应用 ${updated.length} 个附件映射`)
      } finally {
        this.applying = false
      }
    },
    async saveTransactionEdit(dto: BankTransactionSaveDTO) {
      const updated = await saveTransaction(dto)
      const idx = this.list.findIndex(t => t.id === updated.id)
      if (idx >= 0) this.list.splice(idx, 1, updated)
      else this.list.unshift(updated)
    },
  },
})
