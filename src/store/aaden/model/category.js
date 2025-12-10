import hillo from 'hillo'
import { getDeName } from '../utils'


const entity = {
  name: 'category',
  add: async function (baseUrl, category) {
    const obj = category
    obj.printOrder = 50
    obj.catTypeId = category.dishesCategoryTypeId
    return (await hillo.post(baseUrl + 'Category.php?op=add', {...obj, langs: JSON.stringify(category.langs)})).content
  },
  /**
   * @param baseUrl
   * @return {Promise<Array>}
   */
  load: async function (baseUrl) {
    return (await hillo.get(baseUrl + 'Category.php')).content.map(c => {
      c.name = getDeName(c)
      return c
    })
  },


  hash: function (item) {
    return getDeName(item) + item.dishesCategoryTypeId
  }
}

export default entity

