import hillo from "hillo";
import dayjs from "dayjs";

const unWantedDishesCode = ['eag', 'ea9', 'ea1', 'lk']


export async function getDishList (url) {
    return (await hillo.get(url + 'Dishes.php', {
        lang: 'DE',
        onlyActive: 0,
    }))
        .content.map(function (item) {
            // item.displayCode = item.code.length > 5 ? item.code.slice(0, 5) + '...' : item.code
            // item.id = item.dishId
            item.attributeGroupId = [
                item.inheritAttributeGroupId ? item.inheritAttributeGroupId.split(',') : [],
                item.localAttributeGroupId ? item.localAttributeGroupId.split(',') : [],
            ].flat().join(',')
            item.langs = item.langs.map(i => {
                return {
                    ...i,
                    desc: i.description,
                }
            })
            return item
        }).filter(d => !unWantedDishesCode.includes(d.code.toLowerCase()))
}

export async function getDishCodeList (url) {
    const dishList = await getDishList(url)
    return {list: dishList, codeList: dishList.map(d => d.code.toLowerCase())}
}


export async function addDish(url,item) {
    item.attributeGroup = item.attributeGroupId?.filter(i => !item.inheritAttributeGroupId.includes(i)).join(',') ?? ""
    item.allergenGroup = item.AllergenId?.join(',') ?? ""
    console.log(item.extraPrintGroupIds)
    item.extraPrintGroupIds = item.extraPrintGroupIds?.join ? item.extraPrintGroupIds.join(',') : ''

    return await hillo.postWithUploadFile(url + 'Dishes.php?op=add', {
        ...item,
        params: JSON.stringify(item),
    })
}


export async function updateDish(url,item) {
    item.id = item.dishId
    if (item.file) {
        item.imageExt = item.file.name.split('.')[1]
    }
    item.isActive = item.isActive.toString() === '1' ? 1 : 0

    return await hillo.postWithUploadFile(url + 'Dishes.php?op=update', {
        ...item,
        params: JSON.stringify(item),
    })
}


export function hashCode (item) {
    return item.code + '-' + dayjs().format('MMDDHHmmss')
}

export function getDeName (objWithLangs) {
    return objWithLangs.langs?.find(l => l.lang === 'DE')?.name ?? "Keine Name"
}

export async function getCategoryList (url) {
    return (await hillo.get(url + 'Category.php')).content.map(c => {
        c.baseCatName = getDeName(c)
        return c
    })
}
