import hillo from 'hillo'

const unWantedDishesCode = ['eag', 'ea9', 'ea1', 'lk']

const entity = {
  /**
   * @param baseUrl
   * @return {Promise<Array>}
   */
  name: 'dish',
  load: async function (baseUrl) {
    return (await hillo.get(baseUrl + 'Dishes.php')).content.map(d => {
      d.attributeGroupIds = d?.modInfo?.map(it => it.id) ?? []
      d.langs = d.langs.map(i => {
        return {
          ...i, desc: i.description
        }
      })
      d.allergenIds = d.AllergenId?.split(',') ?? []
      return d
    }).filter(d => !unWantedDishesCode.includes(d.code.toLowerCase()))
  },

  add: async function (baseUrl, dish) {
    return (await hillo.postWithUploadFile(baseUrl + 'Dishes.php?op=add', {
      file: dish.file,
      params: JSON.stringify(dish),
      attributeGroup: dish.attributeGroupIds?.join(',') ?? "",
      allergenGroup: dish.allergenIds.join(',')
    }))
  },


  hash: function (item) {
    return item.id
  }
}

export default entity
