import { ShapeFlags } from "@vue-mini/shared";
import { Vnode, Children } from "./types"

export { createVnode as createElementVNode }

export const createVnode = (
    type: any,
    props?: any,
    children?: string | Array<any>[]
) => {
    // type 可能为 div 或者组件对象
    const vnode:Vnode = {
        el: null,
        component: null,
        key: props?.key,
        type,
        props: props || {},
        children,
        shapeFlag: getShapeFlag(type)
    }

    // 基于子元素在此设置 shapeflag
    if (Array.isArray(children)) {
        vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN
    } else if(typeof children == "string") {
        vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN
    }

    normalizeChildren(vnode, children)

    return vnode
}

export const normalizeChildren = (vnode:Vnode, children:Children) => {
    // 对子元素为对象时进行特殊处理
    if (typeof vnode.children === 'object') {
        if (vnode.shapeFlag & ShapeFlags.ELEMENT) {
            // 为 element元素
        } else {
            // 这里就符合 component
            vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN
        }
    }
}   

// 用 symbol 作为唯一标识
export const Text = Symbol("Text");
export const Fragment = Symbol("Fragment");

export const createTextNode = (text: string = '') => {
    return createVnode(Text, {}, text )
}

export const normalizeVnode = (child) => {
    // 暂时只支持处理 child 为 string 和 number的
    if (typeof child === "string" || typeof child === "number") {
        // 将文字转为文本 vnode
        return createVnode(Text, null, String(child))
    } else {
        return child
    }
}
// 根据type判断是什么组件
function getShapeFlag(type: string) {
    return typeof type === "string"
        ? ShapeFlags.ELEMENT
        : ShapeFlags.STATEFUL_COMPONENT
}