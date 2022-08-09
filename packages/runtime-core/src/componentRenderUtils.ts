/**
 * 
 *  存储组件渲染用到的工具函数
 * 
 */
import { isEmptyObject } from "@vue-mini/shared"
// 是否应该更新，如果不更新组件就直接使用之前的组件
export function shouldUpdateComponent(prevVNode, nextVNode) {
    // 本质上是比较 props 有没有更改， 如果有更改则更新组件
    const { props: prevProps } = prevVNode
    const { props: nextProps } = nextVNode

    if (prevProps === nextProps) {
        return false
    }

    // 如果之前没有值，则判断之后有没有值
    if (!isEmptyObject(prevProps)) {
        return !!nextProps
    }
    // 当之后没有 props 时需要更新
    if (isEmptyObject(nextProps)) {
        return true
    }

    return hasPropsChanged(prevProps, nextProps)
}

// 精细化判断
function hasPropsChanged(prevProps, nextProps) {
      const nextKeys = Object.keys(nextProps)

      if (nextKeys.length !== Object.keys(prevProps).length) {
        return true
      }

      for (let idx of nextKeys) {
        const key = nextKeys[idx]
        if (Object.is(prevProps[key], nextProps[key])) {
            return true
        } 
      }
      
      return false
}