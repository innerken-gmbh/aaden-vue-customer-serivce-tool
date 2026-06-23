import hillo from "hillo";

export async function addAttributeGroup(url,item) {
    item.langs = JSON.stringify(item.langs)
    return await hillo.post(url + 'Category.php?op=addAttributeGroup', {
        ...item,
    })
}

export async function getAttributeGroup(url) {
    return (await hillo.get(url + 'Category.php?op=showAttributeGroup', {
        langs: 'zh',
    })).content
}

export async function updateAttributeGroup(url,item) {
    item.langs = JSON.stringify(item.langs)
    return hillo.postWithUploadFile(url + 'Category.php?op=updateAttributeGroup', item, {
        showLoading: false
    })
}


export function hashAttributeGroupWithFiles(info) {
    return info.required + '-' + info.multiSelect + '-' + info.asTeaMakerAttribute + '-' + info.isActive;
}

export function hashAttributeGroupWithSystem(info) {
    return info.required + '-' + info.multiSelect + '-' + info.asTeaMakerAttribute + '-' + info.isActive;
}

export function hashAttributeName (langs) {
    return langs.map(lang => lang.name)
}


export function hashAttributeGroupValue (info) {
    return info.agNameDE + '-' + info.agMultiSelect + '-' + info.agRequired + '-' + info.agAsTeaMakerAttribute + '-' + info.agIsActive;
}

export function getErrorKey (index) {
    const keys = ['agMultiSelect','agRequired','agAsTeaMakerAttribute','agIsActive','agNameDE']
    return index.map(i => keys[i])
}
