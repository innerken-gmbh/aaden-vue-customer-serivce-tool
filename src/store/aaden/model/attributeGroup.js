import hillo from 'hillo'
import attribute from './attribute'


const entity = {
  name: 'attributeGroup',
  add: async function (baseUrl, attrGroup) {
    return (await hillo.post(baseUrl + 'Category.php?op=addAttributeGroup', attrGroup)).content
  },
  /**
   * @param baseUrl
   * @return {Promise<Array>}
   */
  load: async function (baseUrl) {
    const attributeList = (await attribute.load(baseUrl))
    return (await hillo.get(baseUrl + 'Category.php?op=showAttributeGroup&lang=ZH')).content.map(ag => {
      ag.attributes = attributeList.filter(a =>
        a.attributeGroupId === ag.id
      )
      return ag
    })
  },


  hash: function (item) {
    const hashAttribute = item.attributes.reduce((string, i) => {
      string += '/' + attribute.hash(i)
      return string
    }, '')
    return item.name + item.multiSelect + item.required + item.printTitle + item.attributeCount + hashAttribute
  }
}

export default entity
