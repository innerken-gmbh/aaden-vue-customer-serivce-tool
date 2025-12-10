import hillo from 'hillo'

const entity = {
  name:'printerGroup',
  add: async function (baseUrl, section) {
    return (await hillo.post(baseUrl + 'Printer.php?op=addPrinterGroups', section)).content
  },
  /**
   * @param baseUrl
   * @return {Promise<Array>}
   */
  load: async function (baseUrl) {
    return (await hillo.get(baseUrl + 'Printer.php?op=showPrinterGroups')).content
  },
  hash: function (item) {
    return item.id
  }
}

export default entity
