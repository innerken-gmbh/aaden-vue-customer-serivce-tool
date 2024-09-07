import {defineStore} from "pinia";
import {ref} from "vue";

export const InputType = {
    SingleText: 'SingleText',
    TextArea: 'TextArea',
    Number: 'Number',
    Selection: 'Selection',
}
export const useDialogStore
    = defineStore('dialog', () => {
    const dialogShow = ref(false)
    const dialogSchemas = ref([])
    const oldObject = ref(null)
    const resolve = ref(null)
    const loading = ref(false)
    const dialogTitle = ref("")
    const dialogSubtitle = ref("")

    async function waitFor(action) {
        loading.value = true
        try {
            await action()
            dialogShow.value = false
        } catch (e) {
            console.log(e, 'error handle')
        }
        loading.value = false

    }

    async function editItem(schema, object = null) {
        dialogShow.value = true
        loading.value = true
        const {schemas, title, subtitle} = await schema

        return new Promise(res => {
            oldObject.value = object
            dialogSchemas.value = schemas
            dialogTitle.value = title
            dialogSubtitle.value = subtitle
            loading.value = false
            resolve.value = res
        })
    }


    return {
        dialogShow,
        dialogSchemas,
        dialogSubtitle,
        dialogTitle,
        resolve,
        oldObject,
        loading,
        editItem,
        waitFor,
    }

})


