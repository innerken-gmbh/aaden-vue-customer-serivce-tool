import {sumBy, uniqBy} from "lodash-es";
import {computed, ref} from "vue";
import hillo from "hillo";

/**
 * @param {string} name
 * @param listTransform
 */
export function getCRUDActions(name, listTransform = null) {
    return {
        async list() {
            const items = await hillo.get(name + '/list/')
            if (listTransform) {
                return listTransform(items)
            } else {
                return items
            }
        }
    }
}

export function getNormalStore(Manager) {
    const list = ref([])
    const loading = ref(false)
    const expand = ref(false)
    const selectedList = ref([])
    const activeId = ref(null)
    const filter = ref(null)

    async function load() {
        list.value = await Manager.list(filter.value)
        selectedList.value = []
    }

    async function asyncAction(action) {
        loading.value = true
        try {
            await action()
        } catch (e) {
            console.log(e)
        }
        loading.value = false
    }

    async function reload() {
        await asyncAction(load)
    }


    function toggle(id) {
        if (isActive(id)) {
            selectedList.value =
                selectedList.value.filter(it => it !== id)
        } else {
            selectedList.value.push(id)
        }
    }

    const detailDialog = ref(false)

    function showDetail(id) {
        activeId.value = id
        detailDialog.value = true
    }

    function isActive(id) {
        return selectedList.value.includes(id) || activeId.value === id
    }

    const activeItem = computed(() => {
        return findById(activeId.value)
    })

    function findById(id) {
        return list.value.find(it => it.id === id)
    }

    return {
        detailDialog,
        showDetail,
        list,
        loading,
        expand,
        asyncAction,
        selectedList,
        activeId,
        reload,
        toggle,
        isActive,
        findById,
        activeItem,
        filter,
    }
}

export function treeToList(tree, childKey, nodes = []) {
    if (tree[childKey]?.length > 0) {
        nodes.push(tree)
        tree[childKey].forEach(it => {
            it.parentId = tree.id
            treeToList(it, childKey, nodes)
        })
    } else {
        nodes.push(tree)
    }
    return uniqBy(nodes, 'id')
}

export const Actions = {
    Delete: 'Delete',
    Edit: 'Edit'
}
export const normalActions = [
    {name: Actions.Edit, icon: 'mdi-pencil'},
    {name: Actions.Delete, icon: 'mdi-delete'},
]

export function priceFormat(price) {
    const res = parseFloat(price).toFixed(2) === '-0.00' ? '0.00' : parseFloat(price).toFixed(2)
    return res.replace('.', ',') + ' €'
}

export function safeSumBy(arr, key) {
    return sumBy(arr, (item) => {
        return parseFloat(item[key]);
    });
}
