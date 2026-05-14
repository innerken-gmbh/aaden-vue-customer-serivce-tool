import hillo from "hillo";

export async function addAttribute(url,item) {
    item.langs = JSON.stringify(item.langs)
    return await hillo.post(url + 'Category.php?op=addAttribute', {
        ...item,
    })
}

export async function getAttribute(url) {
    return (await hillo.get(url + 'Category.php?op=showAttribute', {
        langs: 'zh',
    })).content
}

export async function updateAttribute(url,item) {
    item.langs = JSON.stringify(item.langs)
    return hillo.postWithUploadFile(url + 'Category.php?op=updateAttribute', item, {
        showLoading: false
    })
}

export function hashAttributeName (langs) {
    return langs.map(lang => lang.name)
}

export function hashAttributeWithFiles(info) {
    return info.aPriceMod.toFixed(2)  + '-' + info.aDishesCategoryTypeId + '-' + info.aFrontendHide + '-' + info.aUseTeaMaker + '-' + info.aTeaMakerCode + '-' + info.aInstruction + '-' + info.aIsActive;
}

export function hashAttributeWithSystem(info) {
    return info.priceMod  + '-' + info.dishesCategoryTypeId + '-' + info.frontendHide + '-' + info.useTeaMaker + '-' + info.teaMakerCode + '-' + info.instruction + '-' + info.isActive;}

export async function flipAttributes (baseUrl, id, agId, aId) {
    return (await hillo.post(baseUrl + 'Dishes.php?op=flipAttributes', {
        idAgIdAIds: JSON.stringify([{
            id,
            agId,
            aId
        }])
    })).content
}
