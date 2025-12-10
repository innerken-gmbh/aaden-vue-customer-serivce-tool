import {
    addDotTillUnique,
    changeKeyToRemote,
    filterListWithSet,
    getDeName,
    getImageFile,
    getKeySet, getNgrokPHPUrl,
    getNgrokResourceUrl,
    listToDict,
    setDeName,
    treeShaking
} from '../utils'
import dish from '../model/dish'
import category from '../model/category'
import attributeGroup from '../model/attributeGroup'
import attribute, { flipAttributes } from '../model/attribute'
import allergen from '../model/allergen'
import printerGroup from '../model/printerGroup'
import { groupBy } from 'lodash-es'

/**
 * @param {*} sourceDeviceId
 * @param {Set} codeSet
 * @param {*} targetDeviceId
 * @return {Promise<{dishesList, categoryList, attributeList, allergenList, printerGroupList,attributeGroupList}>}
 */
export async function prepareData (sourceDeviceId, codeSet, targetDeviceId) {
    const sourceBase = getNgrokPHPUrl(sourceDeviceId)
    const dishesList = filterListWithSet(codeSet, await dish.load(sourceBase), 'code')

    const treeShakeAndMarkChange = async (model, key, filterkey = 'id', sourceList = dishesList) => {
        return await treeShakingAndMarkChanges(sourceList, key, filterkey, model, sourceDeviceId, targetDeviceId)
    }


    const categoryList = await treeShakeAndMarkChange(category, 'categoryId')

    const attributeGroupList = await treeShakeAndMarkChange(attributeGroup, 'attributeGroupIds')

    const attributeList = await treeShakeAndMarkChange(attribute, 'id', 'attributeGroupId', attributeGroupList)

    const allergenList = await treeShakeAndMarkChange(allergen, 'allergenIds')

    const printerGroupList = await treeShakeAndMarkChange(printerGroup, 'printGroupId')
    for (const i of dishesList) {
        i.file = await getImageFile(getNgrokResourceUrl(sourceDeviceId) + 'dishImg/' + i.image)
    }
    for (const i of attributeList) {
        i.file = await getImageFile(getNgrokResourceUrl(sourceDeviceId) + i.image)
    }
    console.log(printerGroupList)
    return {
        dishesList, categoryList, attributeList, allergenList, printerGroupList, attributeGroupList
    }

}

/**
 * @param {{dishesList, categoryList, attributeList, allergenList, printerGroupList,attributeGroupList}} preparedData
 * @param targetDeviceId
 * @param logFunc
 * @return {Promise<void>}
 */
export async function uploadPreparedData (preparedData, targetDeviceId, logFunc, sourceDeviceId) {
    try {
        const targetBaseUrl = getNgrokPHPUrl(targetDeviceId)

        const upload = async (list, model) => {
            for (const item of list) {
                const res = await uploadIfNew(item, (_i) => model.add(targetBaseUrl, _i))
                if (res) {
                    logFunc(item.name + "上传成功")
                } else {
                    logFunc(item.name + "无需上传")
                }

            }
        }


        logFunc('上传属性组-->')
        await upload(preparedData.attributeGroupList, attributeGroup)
        const attrGroupIdRemoteIdMap = dictIdRemoteId(preparedData.attributeGroupList)
        changeKeyToRemote(preparedData.attributeList, 'attributeGroupId', attrGroupIdRemoteIdMap)

        logFunc('上传属性-->')
        await upload(preparedData.attributeList, attribute)
        const attrIdRemoteIdMap = dictIdRemoteId(preparedData.attributeList)


        const targetDishCodeSet = getKeySet(await dish.load(targetBaseUrl), 'code')
        const dishes = preparedData.dishesList.map(d => {
            d.code = addDotTillUnique(d.code, targetDishCodeSet)
            targetDishCodeSet.add(d.code)
            return d
        })
        const targetCategory = (await category.load(targetBaseUrl)).map(ct => {
            return {name: getDeName(ct)}
        })

        const categories = preparedData.categoryList.map(c => {
            const nameDe = addDotTillUnique(getDeName(c), getKeySet(targetCategory, 'name'))
            setDeName(c, nameDe)
            return c
        })

        logFunc('上传菜品标签-->')
        await upload(categories, category)
        changeKeyToRemote(dishes, 'categoryId', dictIdRemoteId(categories))

        logFunc('上传打印机分组-->')
        await upload(preparedData.printerGroupList, printerGroup)
        changeKeyToRemote(dishes, 'printGroupId', dictIdRemoteId(preparedData.printerGroupList))

        logFunc('上传过敏原-->')
        await upload(preparedData.allergenList, allergen)
        const allergenIdRemoteIdMap = dictIdRemoteId(preparedData.allergenList)
        const attrGroupSourceList = await attributeGroup.load(getNgrokPHPUrl(sourceDeviceId))
        const attrSourceList = groupBy(await attribute.load(getNgrokPHPUrl(sourceDeviceId)), 'attributeGroupId')
        console.log(attrGroupSourceList, '源头的属性组列表，用来查看是否需要反选部分属性')
        logFunc('上传菜品-->')
        for (const i of dishes) {

            for (const key in i['attributeGroupIds']) {
                i['attributeGroupIds'][key] = attrGroupIdRemoteIdMap[i['attributeGroupIds'][key]]
            }
            for (const key in i['allergenIds']) {
                i['allergenIds'][key] = allergenIdRemoteIdMap[i['allergenIds'][key]]
            }
            const formattedModInfo = i.modInfo?.map(it => {
                return {
                    id: it.id, aId: it.selectValue?.split(',') ?? []
                }
            }) ?? []
            const res = await dish.add(targetBaseUrl, i)
            const agList = formattedModInfo.map(it => it.id)
            const aList = formattedModInfo.map(it => it.aId).flat()
            for (const agId of agList) {
                const originList = attrSourceList[agId].map(it => it.id)
                for (const aId of originList) {

                    if (!aList.includes(aId)) {
                        await flipAttributes(targetBaseUrl, res.content.id, attrGroupIdRemoteIdMap[agId], attrIdRemoteIdMap[aId])
                        console.log(res.content.id, agId, aId)
                    }
                }
            }


            logFunc(`[${i.dishName}]上传状态：${res.status}/${res.info}`)
        }
        logFunc(dishes.length + "个菜品复制成功！")

    } catch (e) {
        console.error(e)
        logFunc("出问题拉！！！" + e.message)
    }


}

function dictIdRemoteId (arr) {
    return listToDict(arr, 'id', 'idRemote')
}

async function uploadIfNew (obj, uploadFunction, key = 'id') {
    if (!obj[key + 'Remote']) {
        obj[key + 'Remote'] = await upload(obj, key, uploadFunction)
        return true
    }
    return false
}

async function upload (obj, key, uploadFunction) {

    return (await uploadFunction(obj))[key]

}

async function treeShakingAndMarkChanges (sourceList, key, filterkey, model, sourceDeviceId, targetDeviceId) {

    const treeShakeList = treeShaking(sourceList, key, filterkey, await model.load(getNgrokPHPUrl(sourceDeviceId)))
    return markChanges(model, treeShakeList, targetDeviceId)

}

async function markChanges (model, sourceList, targetDeviceId) {

    const remoteList = (await model.load(getNgrokPHPUrl(targetDeviceId)))
        .map(it => ({id: it.id, hash: model.hash(it)}))
    const remoteHashIdDict = listToDict(remoteList, 'hash', 'id')

    const set = getKeySet(remoteList, 'hash')
    return sourceList.map(s => {
        s.idRemote = set.has(model.hash(s)) ? remoteHashIdDict[model.hash(s)] : null
        return s
    })
}

