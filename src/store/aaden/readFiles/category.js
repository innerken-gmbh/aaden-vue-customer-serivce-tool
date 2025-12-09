import hillo from "hillo";

export async function getCategory(url) {
    return (await hillo.get(url + 'Category.php', {
        langs: 'zh',
    })).content
}

export async function getCategoryNameByZHDEEN(url) {
    const list = await getCategory(url)
    return list.map(it => {
        const ZhName = it.langs.find(lang => lang.lang === 'ZH')?.name.toLowerCase()
        const DeName = it.langs.find(lang => lang.lang === 'DE')?.name.toLowerCase()
        const EnName = it.langs.find(lang => lang.lang === 'EN')?.name.toLowerCase()
        return ZhName + DeName + EnName
    })
}

export async function addCategory(url,item) {
    item.catTypeId = item.dishesCategoryTypeId
    return hillo.post(url + 'Category.php?op=add', {
        ...item,
        langs: JSON.stringify(item.langs)
    })
}

function formatItem (item) {
    item.catTypeId = item.dishesCategoryTypeId
    return item
}


export async function updateCategory (url,item) {
    item = formatItem(item)
    if (item.attributeGroupId) {
        item.appliedAttributeGroup = item.attributeGroupId
    }
    return hillo.postWithUploadFile(url + 'Category.php?op=update', {
        ...item,
        langs: JSON.stringify(item.langs)
    })
}
