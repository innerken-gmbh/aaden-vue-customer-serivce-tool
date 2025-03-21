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

export function getNormalStore(Manager, reloadHook) {
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
        await reloadHook()
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


export function transformChildrenIdsToObjects(data) {
    // 创建一个映射表，方便通过 id 快速查找对象
    const idToObjectMap = new Map();
    data.forEach(item => idToObjectMap.set(item.id, item));

    // 递归处理每个节点
    function processNode(node) {
        if (node.childrenIds && node.childrenIds.length > 0) {
            // 将 childrenIds 替换为 children
            node.children = node.childrenIds.map(id => {
                const child = idToObjectMap.get(id);
                if (child) {
                    // 递归处理子节点
                    return processNode(child);
                }
                return null;
            }).filter(Boolean); // 过滤掉无效的节点
            delete node.childrenIds; // 删除原始的 childrenIds
        }
        return node;
    }
    // 找到所有根节点（parentId 为 null 的节点）
    const roots = data.filter(item => item.parentId === null);
    return roots.map(root => processNode(root));
}
