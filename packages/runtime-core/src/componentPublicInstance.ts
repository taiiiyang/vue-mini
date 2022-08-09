import { isEmptyObject, hasOwn } from "@vue-mini/shared";

// 这些属性是直接挂载在实例上的
const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $emit: (i) => i.$emit,
    $props: (i) => i.props,
    $slots: (i) => i.$slots
}
// 全局 proxy 的处理函数
export const PublicInstanceProxyHandler = {
    get({_: instance}, key) {
        const { setupState, props } = instance

        if (key[0] !== '$') {
            // 说明不是访问公共api
            if (hasOwn(setupState, key)) {
                return setupState[key]
            } else if (hasOwn(props, key)) {
                return props[key]
            }
        }

        const publicGetter = publicPropertiesMap[key]

        if (publicGetter) {
            // 返回调用的结果
            return publicGetter(instance)
        }
    },

    set({_: instance, key, value}) {
        const { setupState } = instance

        // 公共实例一般不更改， 如果在安装状态中有，则使用state里的值
        if (isEmptyObject(setupState) && hasOwn(setupState, key)) {
            setupState[key] = value
        }

        return true
    }
}