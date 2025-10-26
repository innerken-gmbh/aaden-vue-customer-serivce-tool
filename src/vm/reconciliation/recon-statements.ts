import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { useRoute } from 'vue-router'
import type { BankStatementDTO } from '@/repo/reconciliation/types'

export const useReconStatementsStore = defineStore('recon-statements', {
  state: () => {
    const route = useRoute()
    const aid = Number(route.params.accountId)
    return {
      accountId: aid as number,
      loading: false as boolean,
      list: [] as BankStatementDTO[],
      showUpload: false as boolean,
      form: reactive({
        description: '',
        file: null as File | null,
      }),
      rules: {} as Record<string, any>,
    }
  },
  actions: {
    _mockStatements(): BankStatementDTO[] {
      return [
        {
          id: 1,
          accountId: this.accountId,
          name: '2025-01 月对账单',
          description: '示例',
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          fileUrl: '#',
          parsed: true,
          createTimestamp: new Date().toISOString(),
        },
      ]
    },
    async load() {
      this.loading = true
      try {
        // TODO: 接入 /recon/statement/list
        this.list = this._mockStatements()
      } finally {
        this.loading = false
      }
    },
    openUpload() {
      this.form.description = ''
      this.form.file = null
      this.showUpload = true
    },
    async submitUpload() {
      // TODO: 调用 /recon/statement/upload，multipart/form-data
      if (!this.form.file) throw new Error('请先选择要上传的 PDF 文件')
      this.showUpload = false
      await this.load()
    },
  },
})
