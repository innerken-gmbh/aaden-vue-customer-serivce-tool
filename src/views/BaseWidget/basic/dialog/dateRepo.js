import dayjs from "dayjs";
import {onBeforeUnmount, ref} from "vue";
import {defineStore} from "pinia";

export const dateFormat = 'YYYY-MM-DD'


export function today() {
    return dayjs().format(dateFormat)
}


export const timestampTemplate = 'YYYY-MM-DD HH:mm:ss'
export const timeFormat = 'HH:mm'

export function toOnlyTimeFormat(str) {
    return dayjs(str).format(timeFormat)
}
export function toDateFormat(str) {
    return dayjs(str).format(dateFormat)
}
export function toDateDisplayFormat(str) {
    return dayjs(str).format("dddd, DD MMM")
}
export function toBeautiful(str) {
    return dayjs(str).format("DD MMMM, HH:mm:ss")
}

export function sliceTime(startTimeString, endTimeString, duration = 'PT15M') {
    const [startTime, endTime] = dayjs(startTimeString, timestampTemplate)
        .isBefore(dayjs(endTimeString, timestampTemplate)) ? [dayjs(startTimeString, timestampTemplate), dayjs(endTimeString, timestampTemplate)]
        : [dayjs(endTimeString, timestampTemplate), dayjs(startTimeString, timestampTemplate)]

    const durationD = dayjs.duration(duration)
    const res = []
    let temp = startTime

    while (temp.isBefore(endTime)) {
        res.push(temp.format(timeFormat))
        temp = temp.add(durationD)
    }
    res.push(endTime.format(timeFormat))
    return res
}



export const useCurrentTime = () => {
    const currentTime = ref(new Date());
    const updateCurrentTime = () => {
        currentTime.value = new Date();
    };
    const updateTimeInterval = setInterval(updateCurrentTime, 60*1000);
    onBeforeUnmount(() => {
        clearInterval(updateTimeInterval);
    });
    return {
        currentTime,
    };
};


export function toCalendarFormat(str) {
    return dayjs(str).calendar(null,{
        sameDay: '[Today]', // The same day ( Today at 2:30 AM )
        nextDay: '[Tomorrow]', // The next day ( Tomorrow at 2:30 AM )
        nextWeek: 'dddd', // The next week ( Sunday at 2:30 AM )
        lastDay: '[Yesterday]', // The day before ( Yesterday at 2:30 AM )
        lastWeek: '[Last] dddd', // Last week ( Last Monday at 2:30 AM )
        sameElse: 'dddd' // Everything else ( 7/10/2011 )
    })
}


export const useDatePickerStore = defineStore('datePicker', {
    state: () => {
        return {
            lastDate: null,
            currentDate: new Date(),
            startDate: new Date(),
            endDate: new Date(),
            showPicker: false,
            resolve: null,
        }
    },
    actions: {
        async selectDate() {
            return new Promise(resolve => {
                this.currentDate = new Date()
                this.startDate = new Date()
                this.endDate = new Date()
                this.showPicker = true
                this.resolve = resolve
            })
        },
        confirm() {
            if (this.resolve) {
                this.resolve({
                    startDate: dayjs(this.startDate).format(dateFormat),
                    endDate: dayjs(this.endDate).format(dateFormat)
                })
                this.showPicker = false
            }
        }
    },
    getters: {
        date(state) {
            return dayjs(state.currentDate).format(dateFormat)
        },
        dateRange(state) {
            return {
                startDate: dayjs(state.startDate).format(dateFormat),
                endDate: dayjs(state.endDate).format(dateFormat)
            }
        }
    }
})
