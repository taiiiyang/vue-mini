import { NodeTypes } from "../ast";
import { isEmptyObject } from "@vue-mini/shared";
import { isText } from "../utils";
import { Context } from "../codegen";

interface Container {
    children?: any[]
}

export function transformText(node, context: Context) {
  if (node.type === NodeTypes.ELEMENT) {
    // 需要判断子节点是不是文本元素
    // "asd, {{msg}}" 需要转为 两个节点
    // text 和 interpolation
    // 不断判断下一个节点是不是 text 节点,并将其放置到容器中
    // 主旨是为了将 text 节点和 interpolation 合并，变为可识别的 JS AST
    return () => {
      const children: Array<any> = node.children;
      let container:Container = {};

      for (let i = 0; i < children.length; i++) {
        const child = children[i];

        if (isText(child)) {
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j];
            if (isText(next)) {
                // 将文本节点不断融合到 i 节点，做为 COMPOUND_EXPRESSION 节点
                !isEmptyObject(container) && (
                    container = children[i] = {
                        type: NodeTypes.COMPOUND_EXPRESSION,
                        loc: child.loc,
                        children: [child]
                    }
                )

                container.children!.push(`+`, next)
                children.splice(j, 1)
                // 已经删除了一个节点， 所以需要 j--
                j--
            } else {
                // 如果没有就置空，进入下一次循环
                container = {}
                break
            }
          }
        }
      }

      return 
    };
  }
}
