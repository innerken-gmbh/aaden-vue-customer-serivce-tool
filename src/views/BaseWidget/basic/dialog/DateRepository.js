/*
 * Copyright (c) 2022-2023. Haodong JU
 */

import dayjs from 'dayjs'
import i18n from '@/i18n'
import { keyBy } from 'lodash-es'

export const dateTemplate = 'YYYY-MM-DD'

export function standardFormatter (dayObj) {
    return dayObj.format(dateTemplate)
}

const now = dayjs().subtract(3, 'hour').subtract(59, 'minute')
export const today = standardFormatter(now)
export const predefinedDateRangeList = [
    {
        label: '今天',
        dateRange: function () {
            return [today, today]
        }
    }, {
        label: '昨天',
        dateRange: function () {
            return [standardFormatter(now.subtract(1, 'day')), standardFormatter(now.subtract(1, 'day'))]
        }
    }, {
        label: '过去7天',
        dateRange: function () {
            return [standardFormatter(now.subtract(7, 'day')), standardFormatter(now.subtract(1, 'day'))]
        }
    }, {
        label: '这周',
        dateRange: function () {
            return [standardFormatter(now.startOf('week')), today]
        }
    }, {
        label: '上周',
        dateRange: function () {
            return [
                standardFormatter(now.subtract(1, 'week').startOf('week')),
                standardFormatter(now.subtract(1, 'week').endOf('week'))
            ]
        }
    }, {
        label: '这个月',
        dateRange: function () {
            return [standardFormatter(now.startOf('month')), today]
        }
    }, {
        label: '上个月',
        dateRange: function () {
            return [
                standardFormatter(now.subtract(1, 'month').startOf('month')),
                standardFormatter(now.subtract(1, 'month').endOf('month'))
            ]
        }
    }, {
        label: '今年',
        dateRange: function () {
            return [standardFormatter(now.startOf('year')), today]
        }
    }
]

export const predefinedDateRangeDict = keyBy(predefinedDateRangeList, 'label')

export function getNiceLabel (dateRange) {
    const result = i18n.t(predefinedDateRangeList.find(s => s.dateRange().join(',') === dateRange.join(','))?.label)
    return (result) || (dateRange[0] === dateRange[1] ? dateRange[0] : dateRange.join(' ~ '))
}

const stripeDateFormat = 'ddd, DD MMM YYYY HH:mm:ss '

export function convertStripeDate (stripeDateString) {
    return standardFormatter(dayjs(stripeDateString, stripeDateFormat))
}
