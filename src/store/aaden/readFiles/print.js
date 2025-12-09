import hillo from "hillo";

export async function addSection(section) {
    return (await hillo.post('Printer.php?op=addPrinterGroups', section)).content
}

export async function loadPrinterGroup (url) {
    return (await hillo.get(url + 'Printer.php', {
        op: 'showPrinterGroups',
    }))
        .content
        .map(a => {
            a.text = a.name
            a.value = a.name
            return a
        })
}
