import Papa from "papaparse";
import readXlsxFile from "read-excel-file";
import {addDish, getCategoryList, getDishList, hashCode, updateDish} from "@/store/aaden/readFiles/dish";

const parseDefaultOption = {
    header: true
}

export function parseCsv(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, Object.assign({}, parseDefaultOption, {
            complete: res => resolve(res.data.filter(d => d)),
            error: res => reject(res),
            transform: (value) => typeof value === 'string' ? value.replace(/\u200b/g, '') : value
        }))
    })
}

export async function parseExcel(file) {
    const res = await readXlsxFile(file)
    // Process the result to remove \u200b characters
    const processedRes = res.map(row =>
        row.map(value =>
            typeof value === 'string' ? value.replace(/\u200b/g, '') : value
        )
    )

    const header = processedRes[0]
    return processedRes.splice(1).map(body => {
        return Object.assign(...header.map((k, i) => ({[k]: body[i]})))
    })
}


function replaceAllSymbol(targetString) {
    return targetString.replaceAll(/[`，“”’‘。^&'",<>]/gi, ' ')
}

const defaultLangItem = {
    name: '',
    desc: '',
    lang: 'ZH'
}

const langKeyArray = ['ZH', 'EN', 'DE']

function capitalize(s) {
    return s && s[0].toUpperCase() + s.slice(1)
}

function getBaseName(lineObject, searchKey) {
    lineObject['base' + capitalize(searchKey)] = lineObject[searchKey + 'DE'] ?? lineObject[searchKey + 'ZH'] ?? lineObject[searchKey + 'EN']
}


function generateLangsArray(lineObject, searchKey) {
    if (!lineObject['base' + searchKey]) {
        lineObject['base' + searchKey] = getBaseName(lineObject)
    }
    const arr = []
    for (const i of langKeyArray) {
        arr.push(Object.assign({}, defaultLangItem, {
            name: replaceAllSymbol(lineObject[searchKey + i]) ?? replaceAllSymbol(lineObject['base' + searchKey]),
            desc: lineObject?.desc ? replaceAllSymbol(lineObject?.desc) : '',
            lang: i
        }))
    }
    return arr

}

function constructCategoryItem(lineObject) {
    if (lineObject.code !== '') {
        return {
            catTypeId: lineObject.catTypeId ? lineObject.catTypeId : 10,
            langs: generateLangsArray(lineObject, 'catName'),
            categoryFakeId: lineObject.categoryFakeId
        }
    }
}


function fetchCategoryInfo(rawInfo) {
    let categoryFakeId = 1
    const categoryMap = rawInfo.reduce((obj, l) => {
        if (Object.keys(obj).includes(l.baseCatName)) {
            l.categoryFakeId = obj[l.baseCatName].categoryFakeId
            return obj
        } else {
            l.categoryFakeId = categoryFakeId
            categoryFakeId++
            obj[l.baseCatName] = constructCategoryItem(l)
            return obj
        }
    }, {})
    return Object.values(categoryMap)
}

function constructDishItem(lineObject) {
    if (lineObject.code !== '') {
        return {
            baseCatName: replaceAllSymbol(lineObject.baseCatName),
            code: lineObject.code,
            langs: generateLangsArray(lineObject, 'name'),
            price: lineObject.price ? lineObject.price : 0,
            printGroupId: lineObject.printCatId ? lineObject.printCatId : 1,
            categoryFakeId: lineObject.categoryFakeId
        }
    }
}

function constructPrinterSectionItem(lineObject) {
    if (lineObject.code !== '') {
        return {
            id: lineObject.printCatId,
            name: 'printer ' + lineObject.printCatId,
            isSingleLinePrint: false,
            isSingleOrderPrint: false,
            upsideDown: false,
            defaultRetryCount: 0
        }
    }
}

export async function loadInfosFromCsv(rawInfo) {

    // const res = (await parseCsv(file))
    // console.log("parseCsv", res)


    const res = rawInfo.map(l => {
        getBaseName(l, 'name')
        getBaseName(l, 'catName')
        return l
    })
    const categoryInfo = fetchCategoryInfo(res).filter(c => c)
    const dishInfo = (res.map(l => constructDishItem(l))).filter(d => d)
    console.log(dishInfo, 'read CSV dish info')
    console.log(categoryInfo, 'read CSV cat info')
    let obj = {}
    const printerInfo = res.reduce((cur, next) => {
        obj[next.printCatId] ? "" : obj[next.printCatId] = cur.push(constructPrinterSectionItem(next))
        return cur
    }, [])
    printerInfo.pop()
    return {
        categoryInfo, dishInfo, printerInfo
    }

}

const listWithFilter = (sourceList, codeSet, filterKey) => {
    return sourceList.filter(i => codeSet.has(i[filterKey]))
}


async function upload(oldDataList, newDataList, categoryList, url) {

    await oldDataList.forEach((data) => {
        // const res = Object.assign({}, data)
        // // XX1-0109.split('-')
        // res.code = model.hashCode(data)
        const res = data
        res.code = hashCode(data)
        console.log("upload old", res)
        updateDish(url, res)
    })
    await newDataList.forEach((data) => {
        const cat = categoryList.find(i => i.baseCatName === data.baseCatName)
        if (cat) {
            data.categoryId = cat.id
            addDish(url, data)
        }
    })
}

export async function uploadData(newDataList, url) {
    // const baseUrl = getNgrokUrl(deviceID)
    const codeSet = newDataList.map(i => i.code)
    console.log("codeSet", codeSet)
    console.log('await dish.load()', await getDishList(url))
    const oldDataList = listWithFilter(await getDishList(url), new Set(codeSet), 'code')
    const categoryList = await getCategoryList(url)

    console.log('oldDataList up', oldDataList)
    console.log('newDataList up', newDataList)
    await upload(oldDataList, newDataList, categoryList, url)
    console.log(categoryList)
    // await upload(categoryList,category)

}


export function hashCodeWithFiles(info, haveIsActive = false, keyInstruction = false) {
    let result = info.nameZH.toLowerCase() + '-' + info.nameDE.toLowerCase() + '-' + info.nameEN.toLowerCase() + '-' + parseFloat(info.price).toFixed(2) + '-' + info.catTypeId;
    if (haveIsActive) {
        result += '-' + info.isActive.toString();
    }
    if (keyInstruction) {
        result += '-' + info.keyInstruction;
    }
    return result;
}

export function hashCodeWithSystem(info, haveIsActive = false, keyInstruction = false, dishesCategoryTypeId) {
    const ZhName = info.langs.find(lang => lang.lang === 'ZH')?.name.toLowerCase()
    const DeName = info.langs.find(lang => lang.lang === 'DE')?.name.toLowerCase()
    const EnName = info.langs.find(lang => lang.lang === 'EN')?.name.toLowerCase()
    let result = ZhName + '-' + DeName + '-' + EnName + '-' + info.price.toString() + '-' + dishesCategoryTypeId;
    if (haveIsActive) {
        result += '-' + info.isActive.toString();
    }
    if (keyInstruction) {
        result += '-' + info.keyInstruction;
    }
    return result;
}


export function hashCodeByCompare(info) {
    return info.nameZH.toLowerCase() + '-' + info.nameDE.toLowerCase() + '-' + info.nameEN.toLowerCase() + '-' + parseFloat(info.price).toFixed(2) + '-' + info.catTypeId + '-' + info.keyInstruction + '-' + info.isActive + info.catNameZH.toLowerCase() + '-' + info.catNameDE.toLowerCase() + '-' + info.catNameEN.toLowerCase() + '-' + info.printCatId
}
