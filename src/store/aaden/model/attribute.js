import hillo from 'hillo'

const entity = {

  name: 'attribute',

  add: async function (baseUrl, attr) {
    return (await hillo.postWithUploadFile(baseUrl + 'Category.php?op=addAttribute', attr)).content
  },
  /**
   * @param baseUrl
   * @return {Promise<Array>}
   */
  load: async function (baseUrl) {
    return (await hillo.get(baseUrl + 'Category.php?op=showAttribute&lang=ZH')).content
  },
  hash: function (item) {
    return item.name + item.dishesCategoryTypeId + item.priceMod + item.printMod
  }
}

export default entity

export async function flipAttributes (baseUrl, id, agId, aId) {
  return (await hillo.post(baseUrl + 'Dishes.php?op=flipAttributes', {
    idAgIdAIds: JSON.stringify([{
      id,
      agId,
      aId
    }])
  })).content
}
