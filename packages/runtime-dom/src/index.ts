/**
 * 主要功能是适配了浏览器环境下节点和节点属性的增删改查。
 * 它暴露了两个重要 API：render 和 createApp，
 * 并声明了一个 ComponentPublicInstance 接口。
 */
import { createRenderer } from "@vue-mini/runtime-core"
import { isOn, isFunction } from "@vue-mini/shared"

function createElement(type) {
    console.log("createElement")

    const element = document.createElement(type)

    return element
}

function createText(text) {
    return document.createTextNode(text)
}

function createInvoker(initialValue: Function) {
    const invoker = () => {
        if (initialValue && isFunction(initialValue)) {
            initialValue()
        }
    }

    invoker.value = initialValue
    return invoker
}

function patchProp(el, key, preValue, nextValue) {
    // 为之后update做准备

    console.log("key", key)
    console.log("preValue", preValue)
    console.log("nextValue", nextValue)

    // 是 on 开头则判断为函数
    if (isOn(key)) {
        // 存储所有的事件函数
        const invokers = el._vei || (el._vei = {})
        const existingInvoker = invokers[key]

        if (existingInvoker && nextValue && isFunction(nextValue)) {
            // patch
            // 直接修改函数的值
            existingInvoker.value = nextValue
        } else {
            const eventName = key.slice(2).toLowercase()

            if (nextValue && isFunction(nextValue)) {
                const invoker = (invokers[key] = createInvoker(nextValue))
                el.addEventListener(eventName, invoker)
            } else {
                // 下一次没有值则代表需要移除
                el.removeEventListener(eventName, existingInvoker)
            }
        }
    } else {
        if (nextValue === null || nextValue === "") {
            el.removeAttribute(key)
        } else {
            el.setAttribute(key, nextValue)
        }
    }
}

function setText(node, value) {
    node.nodeValue = value
}

function setElementText(el, text) {
    console.log("setElementText")

    el.textContent = text
}

function insert(child, parent, anchor = null){
    console.log("insert")
    parent.insertBefore(child, anchor)
}

function remove(child){
    const parent = child.parentNode
    if (parent) {
        parent.removeChild(child)
    }
}

let renderer;

function ensureRenderer() {
    return (
        renderer || (
            renderer = createRenderer({
                createElement,
                createText,
                setText,
                setElementText,
                patchProp,
                insert,
                remove
            })
        )
    )
}

export function createApp(...args) {
    return ensureRenderer().createApp(...args)
}

export * from "@vue-mini/runtime-core"