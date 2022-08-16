import { createVNodeCall, NodeTypes } from "../ast";

export function transformElement(node, context) {
    // 处理 element 节点的转换
    if (node.type === NodeTypes.ELEMENT) {
        return () => {
            const vnodeTag = `${node.tag}`

            const vnodeProps = null
            let vnodeChildren = null
            if (node.children.length == 1) {
                const child = node.children[0]
                vnodeChildren = child
            }
            // 添加 codegen 便于之后 codegen 调用
            node.codegen = createVNodeCall(
                context,
                vnodeTag,
                vnodeProps,
                vnodeChildren
            )
        }
    }
}