import hillo from 'hillo'

const entity = {
  name: 'allergen', add: async function (baseUrl, allergen) {
    return (await hillo.post(baseUrl + 'Dishes.php?op=addAllergen', allergen)).content
  }, /**
   * @param baseUrl
   * @return {Promise<Array>}
   */
  load: async function (baseUrl) {
    return (await hillo.get(baseUrl + 'Dishes.php?op=showAllAllergen')).content
  }, hash: function (item) {
    return item.id
  }
}

export default entity
