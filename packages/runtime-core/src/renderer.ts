import { ShapeFlags, isString, isArray } from "@vue-mini/shared";
import { createComponentInstance, setupComponent } from "./component";
import { queueJob } from "./scheduler";
import { effect } from "@vue-mini/reactivity";
import { Fragment, normalizeVnode, Text } from "./vnode";
import { shouldUpdateComponent } from "./componentRenderUtils";
import { createAppAPI } from "./createApp";
import { Children, Vnode } from "./types";
/**
 *
 * @param options
 * @description 创建渲染器，在内部调用 render，mount，patch 操作
 */
export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    setElementText: hostSetElementText,
    patchProps: hostPatchProps,
    insert: hostInsert,
    remove: hostRemove,
    setText: hostSetText,
    createText: hostCreateText,
  } = options;

  const render = (vnode: Vnode, container: HTMLElement) => {
    console.log("render");
    patch(null, vnode, container);
  };

  function patch(
    n1: Vnode | null,
    n2: Vnode | null,
    container?: HTMLElement,
    anchor?,
    parentComponent?
  ) {
    // 基于 n2 的类型来判断
    if (n2) {
      const { type, shapeFlag } = n2;
      switch (type) {
        case Text:
          processText(n1, n2, container);
          break;
        case Fragment:
          processFragment(n1, n2, container);
          break;
        default:
          // 这里基于 shapeFlags 来处理
          if (shapeFlag & ShapeFlags.ELEMENT) {
            processElement(n1, n2, container, anchor, parentComponent);
          } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
            processComponent(n1, n2, container, parentComponent);
          }
      }
    }
  }

  function processElement(
    n1: Vnode | null,
    n2: Vnode | null,
    container?: HTMLElement,
    anchor?,
    parentComponent?
  ) {
    if (!n1) {
      mountComponent(n2, container, parentComponent);
    } else if (!n2) {
      unmountComponent();
    } else {
      updateComponent();
    }
  }

  function mountComponent(initialVNode, container, parentComponent) {
    const instance = (initialVNode.component = createComponentInstance(
      initialVNode,
      parentComponent
    ));

    console.log("创建组件实例", `${instance.type.name}`);

    setupComponent(instance);

    setupRenderEffect();
  }

  function patchProps(el, prevProps, newProps) {
    for (const key in newProps) {
      const preP = prevProps[key];
      const newP = newProps[key];

      if (newP !== preP) {
        hostPatchProps(el, key, newP, preP);
      }
    }

    for (const key in prevProps) {
      const preP = prevProps[key];
      const newP = null;
      if (!(key in newProps)) {
        hostPatchProps(el, key, preP, newP);
      }
    }
  }

  function patchChildren(
    n1: Vnode | null,
    n2: Vnode | null,
    container: HTMLElement,
    parentAnchor,
    parentComponent
  ) {
    if (n1 && n2) {
      const { shapeFlag: prevShapeFlag, children: c1 } = n1;
      const { shapeFlag, children: c2 } = n2;

      if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        if (c1 !== c2 && typeof c2 === "string") {
          console.log("当前节点为文本子节点", n1, n2);
          hostSetElementText(container, c2);
        }
      } else {
        // 如果之前之后都是数组
        if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          if (
            shapeFlag & ShapeFlags.ARRAY_CHILDREN &&
            Array.isArray(c1) &&
            Array.isArray(c2)
          ) {
            patchKeyedChildren(
              c1,
              c2,
              container,
              parentAnchor,
              parentComponent
            );
          }
        }
      }
    }
  }

  function patchKeyedChildren(
    c1: Vnode[],
    c2: Vnode[],
    container,
    parentAnchor,
    parentComponent
  ) {
    // 本次采用 快速diff 算法
    let idx = 0;
    const l2 = c2.length;
    let e2 = l2 - 1;
    let e1 = c1.length - 1;

    const isSameVnodeType = (n1, n2) => {
      if (!n1.key || !n2.key) console.warn("列表子节点需要接收 key 值")
      return n1.type === n2.type && n1.key === n2.key;
    };

    // 先对前置节点进行预处理，相同的节点不进入快速 diff 的核心算法
    while (idx <= e1 && idx <= e2) {
      const prevChild = c1[idx];
      const newChild = c2[idx];

      if (!isSameVnodeType(prevChild, newChild)) {
        console.log("子节点不同,前置预处理结束");
        console.log(`prevChild:${prevChild}`);
        console.log(`nextChild:${newChild}`);
      }

      patch(prevChild, newChild, container, parentAnchor, parentComponent);
      idx++;
    }

    // 比较后置节点
    while (idx <= e1 && idx <= e2) {
      const prevChild = c1[e1];
      const newChild = c2[e2];

      if (!isSameVnodeType(prevChild, newChild)) {
        console.log("子节点不同,后置预处理结束");
        console.log(`prevChild:${prevChild}`);
        console.log(`nextChild:${newChild}`);
      }

      patch(prevChild, newChild, container, parentAnchor, parentComponent);
      e1--;
      e2--;
    }

    // 交换比较，逐步消耗
    if (idx > e1 && idx <= e2) {
        // 这种情况说明 e2 比 e1 多几个节点
        const nextPos = e2 + 1
        const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor

        while(idx <= e2) {
            patch(null, c2[idx], container, anchor, parentComponent)
            idx++
        }
    } else if (idx <= e1 && idx > e2) {
        // 移除多余节点
        while (idx <= e1) {
            hostRemove(c1[idx].el)
            idx++
        }
    } else {
        let s1 = idx
        let s2 = idx
        const keyToNewIndexMap = new Map()
        let moved = false
        let maxMaxNewIndexSoFar = 0
    }

  }
  function unmountComponent() {}

  function updateComponent() {}

  function setupRenderEffect() {}

  function processComponent(n1, n2, container, parentComponent) {}

  function processFragment(
    n1: Vnode | null,
    n2: Vnode | null,
    container?: HTMLElement
  ) {
    if (!n1) {
      // 文档碎片代表直接将子元素挂载到父元素
      console.log("初始化 Fragment 类型节点");
      mountChildren(n2?.children, container);
    }
  }

  function processText(
    n1: Vnode | null,
    n2: Vnode | null,
    container?: HTMLElement
  ) {
    console.log("处理Text节点");
    if (n1 === null && typeof n2?.children == "string") {
      // n1 为 null 说明是init阶段
      hostInsert((n2.el = hostCreateText(n2.children)), container);
    } else if (n1 && n2) {
      // update
      const el = (n2.el = n1.el);
      if (
        isString(n1.children) &&
        isString(n2.children) &&
        n2.children !== n1.children
      ) {
        console.log("更新文本节点");
        hostSetText(el, n2.children);
      }
    }
  }

  function mountChildren(children: Children, container?: HTMLElement) {
    if (Array.isArray(children)) {
      children.forEach((VnodeChildren) => {
        console.log("mount children", children);
        patch(null, VnodeChildren, container);
      });
    }
  }
}

// 获取最长递增子序列，Vue3通过比较最长递增子序列来确定哪些 DOM 在变更前后是不需要移动的 
// 比如结果是 [0,2,3]
// 那么就代表新节点中处于这些索引的元素不需要进行移动
function getSequence(arr) {
    const p = arr.slice()                 //  保存原始数据
    const result = [0]                    //  存储最长增长子序列的索引数组
    let i, j, u, v, c
    const len = arr.length
    for (i = 0; i < len; i++) {
      const arrI = arr[i]
      if (arrI !== 0) {
        j = result[result.length - 1]     //  j是子序列索引最后一项
        if (arr[j] < arrI) {              //  如果arr[i] > arr[j], 当前值比最后一项还大，可以直接push到索引数组(result)中去
          p[i] = j                        //  p记录第i个位置的索引变为j
          result.push(i)
          continue
        }
        u = 0                             //  数组的第一项
        v = result.length - 1             //  数组的最后一项
        while (u < v) {                   //  如果arrI <= arr[j] 通过二分查找，将i插入到result对应位置；u和v相等时循环停止
          c = ((u + v) / 2) | 0           //  二分查找 
          if (arr[result[c]] < arrI) {
            u = c + 1                     //  移动u
          } else {
            v = c                         //  中间的位置大于等于i,v=c
          }
        }
        if (arrI < arr[result[u]]) {
          if (u > 0) {
            p[i] = result[u - 1]          //  记录修改的索引
          }
          result[u] = i                   //  更新索引数组(result)
        }
      }
    }
    u = result.length
    v = result[u - 1]
    //把u值赋给result  
    while (u-- > 0) {                     //  最后通过p数组对result数组进行进行修订，取得正确的索引
      result[u] = v
      v = p[v];                        
    }
    return result
}