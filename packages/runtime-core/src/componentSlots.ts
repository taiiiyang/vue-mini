/**
 * 
 * 在此处初始化插槽 
 * 
 */

import { ShapeFlags } from "@vue-mini/shared";

export function initSlots(instance, children) {
    const { vnode } = instance

    console.log("正在初始化插槽")

    // 利用位运算来确定是否有插槽属性
    if (vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
        normalizeObjectSlots(children, (instance.slots = {}))
    }
}

function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value]
}

function normalizeObjectSlots(rawSlots, slots) {
    for (const key in rawSlots) {
        const value = rawSlots[key]

        if (typeof value === "function") {
            // 把函数对象存到 slots 上
            // 默认 slots 返回的是 vnode对象
            
            slots[key] = (props) => normalizeSlotValue(value(props))
        }
    }
}