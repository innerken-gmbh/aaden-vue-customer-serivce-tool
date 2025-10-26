import { defineStore } from 'pinia'
import { reactive } from 'vue'
import type { CompanyDTO, CompanySaveDTO, DepartmentHeadSaveDTO } from '@/repo/reconciliation/types'
import { listCompanies, saveCompany } from '@/repo/reconciliation/company.repo'

function mockCompanies(): CompanyDTO[] {
  return [
    { id: 1, name: '示例公司 A', departmentHeads: [], notes: '演示数据', createTimestamp: new Date().toISOString() },
  ]
}

export const useReconCompaniesStore = defineStore('recon-companies', {
  state: () => ({
    loading: false as boolean,
    list: [] as CompanyDTO[],
    showModal: false as boolean,
    editing: null as CompanyDTO | null,
    form: reactive<CompanySaveDTO>({
      name: '',
      notes: '',
      departmentHeads: [] as DepartmentHeadSaveDTO[],
    }) as CompanySaveDTO,
    rules: {
      name: { required: true, message: '请输入公司名称', trigger: ['input', 'blur'] },
    } as Record<string, any>,
  }),
  actions: {
    resetForm() {
      this.form.id = undefined
      this.form.name = ''
      this.form.notes = ''
      this.form.departmentHeads = []
    },
    async load() {
      this.loading = true
      try {
        this.list = await listCompanies()
      } finally {
        this.loading = false
      }
    },
    openCreate() {
      this.editing = null
      this.resetForm()
      this.showModal = true
    },
    openEdit(row: CompanyDTO) {
      this.editing = row
      this.form.id = row.id
      this.form.name = row.name
      this.form.notes = row.notes ?? ''
      this.form.departmentHeads = row.departmentHeads?.map((d) => ({ id: d.id, name: d.name, notes: d.notes })) || []
      this.showModal = true
    },
    async submit() {
      if (!this.form.name || this.form.name.trim().length === 0) throw new Error('公司名称必填')
      await saveCompany({
        id: this.form.id,
        name: this.form.name.trim(),
        notes: this.form.notes?.trim() || undefined,
        departmentHeads: this.form.departmentHeads?.map(d => ({ id: d.id, name: d.name.trim(), notes: d.notes }))
      })
      this.showModal = false
      await this.load()
    },
    addDepartmentHead() {
      this.form.departmentHeads?.push({ name: '' })
    },
    removeDepartmentHead(index: number) {
      this.form.departmentHeads?.splice(index, 1)
    },
  },
})
