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


export async function getDishList(url) {
  const notTouchableDish = keyBy((await hillo.get(url + 'Dishes.php?op=cantChangeDish')).content, 'code')
  const systemDish = ['cashWithdraw', 'cashDeposit', 'gel', 'gk', 'lk']
  return (await hillo.get('Dishes.php', {
    lang: GlobalSettings.getLang(),
    onlyActive: 0,
    ...filter
  }))
      .content.filter(it => !systemDish.includes(it.code)).map(function (item) {
        item.displayCode = item.code.length > 5 ? item.code.slice(0, 5) + '...' : item.code
        item.id = item.dishId
        item.attributeGroupId = [
          item.inheritAttributeGroupId ? item.inheritAttributeGroupId.split(',') : [],
          item.localAttributeGroupId ? item.localAttributeGroupId.split(',') : []
        ].flat().join(',')
        item.usingPfandDishIds = item?.usingPfandDishIds ? item?.usingPfandDishIds.split(',') : []
        item.langs = item.langs.map(i => {
          return {
            ...i,
            desc: i.description
          }
        })
        item.editable = !notTouchableDish[item.code]
        item.priceDisplay = item.price
        return item
      })
}

