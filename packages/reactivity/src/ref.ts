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

import { hasChanged } from "@vue-mini/shared"
import { createDep } from "./dep"
import { trackEffects, triggerEffects } from "./effect"
import { toReactive } from "./reactive"

export function ref(raw) {
    return createRef(raw)
}

function createRef(val) {
    return new ImplRef(val)
}

class ImplRef {
    // 原始对象
    private _rawValue: any
    // 实际需要读取的响应式对象，如果是对象类型就用 reactive 封装，如果不是就直接返回原始值
    private _value: any

    public dep
    public __v_isRef = true

    constructor(value) {
        this._rawValue = value
        this.dep = createDep()
        this._value = toReactive(value)
    }

    get value() {
        trackEffects(this.dep)
        return this._value
    }

    set value(newVal) {
        if (hasChanged(newVal, this._rawValue)) {
            this._value = toReactive(newVal)
            this._rawValue = newVal
            triggerEffects(this.dep)
        }        
    }
}

// 该函数解构 ref 在模板中能直接使用 ref
export const shallowUnwrapHandlers = {
    get (target, key, receiver) {
        // 如果是 ref 直接返回 value
        return unRef(Reflect.get(target, key, receiver))
    },

    set (target, key, value, receiver) {
        const oldValue = target[key]
        // 在模板中赋值，会直接修改 value
        if (isRef(oldValue) && !isRef(value)) {
            return (target[key].value = value)
        } else {
            return Reflect.set(target, key, value, receiver)
        }
    }
}
/**
 * 调用此函数会返回一个新的代理，基于原来的 proxy 再进行一次封装
*/
export function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, shallowUnwrapHandlers)
}

export function isRef(val) {
    return !!val.__v_isRef 
}
export function unRef(ref) {
    return isRef(ref) ? ref.value : ref
}