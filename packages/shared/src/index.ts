export * from "./shapeFlags"
export * from "./toDisplayString"

export const isObject = (val) => {
    return val !== null && typeof val === "object"
}

export const isString = (val) => {
    return  typeof val === "string"
}

export const isFunction = (val) => {
    return typeof val === "function"
}

export const isArray = (val) => {
    return Array.isArray(val)
}
const camelizeRE = /-(\w)/g

export const camelize = (val: string): string => {
    return val.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''))
}

export const extend = Object.assign

export const isOn = (val:string) => /^on[A-Z]/.test(val)

export function hasChanged<T>(val:T, oldVal:T) {
    return !Object.is(val, oldVal)
}

// 检测是否具有 key 属性
export function hasOwn(val:object, key:string) {
    return Object.prototype.hasOwnProperty.call(val, key)
}

export function capitalize(str: string):string {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

// 添加on
export function toHandlerKey(str:string): string {
    return str ? `on${capitalize(str)}` : ''
}


// 用来匹配 kebab-case 的情况
// 比如 onTest-event 可以匹配到 T

const hyphenateRE = /\B([A-Z])/g

export const hyphenate = (str: string) => 
    str.replace(hyphenateRE, '-$1').toLowerCase()

// 判断是否为空对象
export const isEmptyObject = (obj:object) => {
    return Object.keys(obj).length === 0
}