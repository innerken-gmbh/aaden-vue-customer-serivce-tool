import {VSelect,VFileInput} from "vuetify/components";

export const recordSchema = {
    title: '新增事件记录',
    subtitle: '可要好好修改，不要改错了',
    schemas: [
        {
            key: 'content',
            name: '记录内容',
            required: true,
            default: "",
            hint: '发生什么事了'
        },
        // {
        //     key: 'type',
        //     name: '记录类型',
        //     hint: '想写什么写什么',
        //     default: "人工操作",
        // },
        {
            key: 'operator',
            name: '操作人员',
            component: VSelect,
            componentProps: {
                items: [{value: 'JHD',id: 1},{value: 'LC',id: 2},{value: 'YJN',id: 3},{value: 'RSG',id: 4},{value: 'ZX',id: 5},{value: 'AJY',id: 6},{value: 'TYK',id: 7}],
                itemValue: 'value',
                itemTitle: 'value'
            },
            hint: '是谁干的好事',
            default: 'JHD',
        },
        {
            key: 'appendUrl',
            name: '附件',
            hint: '一条记录只能保存一个文件！',
            component: VFileInput,
        }
    ]
}
