import { track, trigger } from "./effect"

export function reactive(target:object) {
    const handler = {
        get(target:object, key:string, receiver) {
            console.log("get the called with key = " + key)
            let result = Reflect.get(target, key, receiver)
            // 跟踪副作用
            track(target, key)
            return result
        },
        set(target, key, value, receiver) {
            let oldValue = target[key]
            console.log("正在设置"+key+"为"+value)
            if (oldValue != value) {
                // 触发依赖函数
                trigger(target, key)
            }
            return Reflect.set(target, key, value, receiver)
        }
    }

    return new Proxy(target, handler)
}