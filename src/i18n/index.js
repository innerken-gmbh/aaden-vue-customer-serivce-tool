import hillo from 'hillo'

function findAny(list, name) {
  return list.find((it) => {
    return it?.langs?.some((that) => that?.name === name)
  })
}

export function dishBuilder(startDishInfo) {
  const dishInfo = startDishInfo

  const copyFrom = async (name, key, sourceKey) => {
    const currentDishList = (await hillo.get('Dishes.php')).content
    console.log(currentDishList)
    const targetDish = findAny(currentDishList, name)
    if (!sourceKey) {
      sourceKey = key
    }
    console.log(targetDish)
    if (targetDish) {
      dishInfo[key] = targetDish[sourceKey]
    } else {
      throw Error('没有找到需要复制的菜品: ' + name)
    }
  }
  const prepareForUpload = () => {
    const newInfo = dishInfo
    newInfo.attributeGroup = dishInfo.attributeGroup.join(',')
    return {
      params: JSON.stringify(newInfo),
      ...newInfo,
    }
  }

  return {
    copyFrom,
    prepareForUpload,
  }
}
