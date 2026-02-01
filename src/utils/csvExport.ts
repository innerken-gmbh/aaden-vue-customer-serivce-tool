/**
 * 将数据导出为 CSV 文件并触发下载
 * @param headers CSV 表头，例如 ['姓名', '年龄']
 * @param rows 数据行，二维数组，例如 [['张三', 20], ['李四', 25]]
 * @param filename 文件名，不含扩展名
 */
export function exportToCSV(headers: string[], rows: any[][], filename: string) {
  // 构造 CSV 内容
  const content = [
    headers.join(','),
    ...rows.map(row => 
      row.map(cell => {
        const text = String(cell ?? '').replace(/"/g, '""') // 转义双引号
        return `"${text}"` // 用双引号包裹每个单元格
      }).join(',')
    )
  ].join('\n')

  // 添加 BOM (Byte Order Mark) 以支持 Excel 正确识别 UTF-8 编码
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' })
  
  // 触发下载
  const link = document.createElement('a')
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}
