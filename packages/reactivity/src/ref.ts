// 接受一个变量， 返回一个响应式对象， 可以使用 .value 读取变量
// Use Object Accessors
/** 
 * let user = {
 *     firstName: "ge",
 *     lastName: "fe",
 * 
 * 
 *     get fullName() {
 *          return firstName + lastName
 *     }
 * }
 * 
 */

import { track, trigger } from "./effect"

export function ref(raw) {
    const r = {
        get value() {
            track(r, "value")
            return raw
        },
        set value(newVal) {
            if (newVal === raw) return 
            raw = newVal
            trigger(r, "value")
        },
    }

    return r
}