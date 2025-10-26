import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { useRoute } from 'vue-router'
import type { ReconciliationAccountDTO, ReconciliationAccountSaveDTO } from '@/repo/reconciliation/types'
import { listAccounts, saveAccount } from '@/repo/reconciliation/account.repo'

function masked(no: string) {
  if (!no) return ''
  if (no.length <= 8) return no
  return no.slice(0, 4) + ' **** **** ' + no.slice(-4)
}

export const useReconAccountsStore = defineStore('recon-accounts', {
  state: () => {
    const route = useRoute()
    const raw = Number(route.params.companyId)
    const cid = Number.isFinite(raw) && raw > 0 ? raw : 1
    return {
      companyId: cid as number,
      loading: false as boolean,
      list: [] as ReconciliationAccountDTO[],
      showModal: false as boolean,
      editing: null as ReconciliationAccountDTO | null,
      form: reactive<ReconciliationAccountSaveDTO>({
        companyId: cid,
        bankName: '',
        accountNumber: '',
        alias: '',
      }) as ReconciliationAccountSaveDTO,
      rules: {
        bankName: { required: true, message: '请输入银行名称', trigger: ['blur', 'input'] },
        accountNumber: { required: true, message: '请输入账号', trigger: ['blur', 'input'] },
      } as Record<string, any>,
    }
  },
  actions: {
    _mockAccounts(): ReconciliationAccountDTO[] {
      return [
        {
          id: 1,
          companyId: this.companyId,
          bankName: '中国银行',
          accountNumber: '6222021234567890',
          alias: '主账户',
          createTimestamp: new Date().toISOString(),
        },
      ]
    },
    async load() {
      this.loading = true
      try {
        this.list = await listAccounts(this.companyId)
      } finally {
        this.loading = false
      }
    },
    openCreate() {
      this.editing = null
      this.form.id = undefined
      this.form.companyId = this.companyId
      this.form.bankName = ''
      this.form.accountNumber = ''
      this.form.alias = ''
      this.showModal = true
    },
    openEdit(row: ReconciliationAccountDTO) {
      this.editing = row
      this.form.id = row.id
      this.form.companyId = row.companyId
      this.form.bankName = row.bankName
      this.form.accountNumber = row.accountNumber
      this.form.alias = row.alias ?? ''
      this.showModal = true
    },
    async submit() {
      if (!this.form.bankName || !this.form.accountNumber) throw new Error('请填写完整信息')
      await saveAccount({
        id: this.form.id,
        companyId: this.companyId,
        bankName: this.form.bankName.trim(),
        accountNumber: this.form.accountNumber.trim(),
        alias: this.form.alias?.trim() || undefined,
      })
      this.showModal = false
      await this.load()
    },
  },
  getters: {
    masked: () => masked,
  },
})
