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
      mountElement(n2, container, parentComponent);
    } else if (!n2) {
      unmountElement(n1);
    } else {
      updateElement(n1, n2, container, anchor, parentComponent);
    }
  }

  function mountElement(vnode, container, anchor) {
    const { shapeFlag, props } = vnode;
    // 创建 element 实际DOM
    const el = (vnode.el = hostCreateElement(vnode.type));

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 对于文本节点，children 就是字符串
      console.log("处理文本节点");
      hostSetElementText(el, vnode.children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 递归调用patch
      mountChildren(vnode.children, container);
    }

    if (props) {
      for (const key in props) {
        // 需要过滤vue 自身的key
        const nextVal = props[key];
        hostPatchProps(el, key, null, nextVal);
      }
    }

    // todo
    // 触发 beforeMount() 钩子
    console.log("vnodeHook  -> onVnodeBeforeMount");
    console.log("DirectiveHook  -> beforeMount");
    console.log("transition  -> beforeEnter");

    // 插入
    hostInsert(el, container, anchor);

    // todo
    // 触发 mounted() 钩子
    console.log("vnodeHook  -> onVnodeMounted");
    console.log("DirectiveHook  -> mounted");
    console.log("transition  -> enter");
  }
  function updateElement(
    n1: Vnode | null,
    n2: Vnode | null,
    container,
    anchor,
    parentComponent
  ) {
    const oldProps = (n1 && n1.props) || {}
    const newProps = n2?.props || {}

    if (n2 && n1) {
      const el = (n2.el = n1.el)

      patchProps(el, oldProps, newProps)

      patchChildren(n1, n2, container, anchor, parentComponent)
    }
  }

  function mountComponent(initialVNode, container, parentComponent) {
    const instance = (initialVNode.component = createComponentInstance(
      initialVNode,
      parentComponent
    ));

    console.log("创建组件实例", `${instance.type.name}`);

    setupComponent(instance);

    setupRenderEffect(instance, initialVNode, container);
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
      if (!n1.key || !n2.key) console.warn("列表子节点需要接收 key 值");
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
      const nextPos = e2 + 1;
      const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor;

      while (idx <= e2) {
        patch(null, c2[idx], container, anchor, parentComponent);
        idx++;
      }
    } else if (idx <= e1 && idx > e2) {
      // 移除多余节点
      while (idx <= e1) {
        hostRemove(c1[idx].el);
        idx++;
      }
    } else {
      // 代表经过预处理之后剩余新节点的数量
      // 这个数量也是 source 的长度，因为 source 代表新节点在旧节点中对应的索引
      const count = e2 - idx + 1;
      const source: Array<number> = new Array(count);
      // source 用来存储新的一组子节点在旧的子节点中的索引，后续使用最长递增子序列的时候会用到
      source.fill(-1);
      let oldStart = idx;
      let newStart = idx;
      // 新子节点中 key 值与其索引的对应关系
      const keyToNewIndexMap = new Map();
      // 代表是否需要移动
      let moved = false;
      // 代表遍历旧的一组子节点中遇到的最大索引值
      // 在简单 diff 算法中，如果索引序列呈递增趋势，则说明不需要移动节点
      let maxNewIndexSoFar = 0;

      // 填充索引表
      for (let i = newStart; i <= e2; i++) {
        keyToNewIndexMap.set(c2[i].key, i);
      }

      // 在这里将对应的节点先更新，之后只需要进行移动操作即可
      // 没有更新到的节点记为 -1 代表之后需要生成新的子节点
      // 已经更新过的节点数量
      let patched = 0;
      for (let i = oldStart; i <= e2; i++) {
        const oldVnode = c2[i];
        // 如果更新过的节点数量小于已经更新的节点数量，则执行更新
        if (patched <= count) {
          // 根据旧子节点的 key 值去 keyMap 中查找对应的新的子节点的索引
          const k = keyToNewIndexMap.get(oldVnode.key);

          if (typeof k !== "undefined") {
            const newVnode = c1[k];
            patch(oldVnode, newVnode, container);
            // 更新 source 数组
            source[k - newStart] = i;
            // 判断是否需要更新
            if (k < maxNewIndexSoFar) {
              moved = true;
            } else {
              // 如果比最远距离大，则代表不需要移动，按照递增序列继续保持原位,不断更新最远索引
              // 只有当序列比最远序列小的时候，才算需要移动
              // 假设还是原位都没有进行移动，那么最远索引将会一直递增
              // 当新子节点的索引比最远索引小的时候，证明他发生了越位,移动到了原先索引比他大的位置
              // old -> 1 2 3 4 5
              // new -> 2 1 3 4 5
              maxNewIndexSoFar = k;
            }
          } else {
            // 如果查找不到对应索引， 则代表需要卸载
            hostRemove(oldVnode.el);
          }
        } else {
          hostRemove(oldVnode.el);
        }
      }

      if (moved) {
        // 根据 source 获取最长递增子序列，最长递增中对应的索引位置上的节点不需要移动
        // 因为他们处于递增的状态，所以只需要保持原状，而不在 source 中的节点则需要根据情况移动
        const seq = getSequence(source);
        // s 指向最长递增子序列中的最后一个元素 (index)
        let s: number = seq.length - 1;
        // i 指向新的一组子节点的最后一个元素 (index)
        let i: number = count - 1;
        // for 循环使 i 递减
        for (i; i >= 0; i--) {
          if (source[i] == -1) {
            // 说明需要挂载
            // 需要挂载的位置(在新子节点中的索引)
            const pos = i + newStart;
            const newVnode = c2[pos];
            const nextPos = pos + 1;
            const anchor = nextPos < l2 ? c2[nextPos] : null;
            patch(null, newVnode, container, anchor);
          } else if (i !== seq[s]) {
            // 不是对应的索引,需要进行移动
            // 在新子节点中真实的索引位置
            const pos = i + newStart;
            const nextPos = pos + 1;
            const newVnode = c2[pos];
            const anchor = nextPos < l2 ? c2[nextPos] : null;
            // 插入(不重新创建DOM)
            hostInsert(newVnode, container, anchor);
          } else {
            // 当相等时，该节点不需要移动
            s--;
          }
        }
      }
    }
  }

  function unmountElement(vnode: Vnode) {
    vnode.el = null;
  }

  // 在响应式数据更新时会调用 update 函数重新为其打补丁
  function updateComponent(n1: Vnode, n2: Vnode, container: HTMLElement) {
    console.log("update component");
    const instance = (n2.component = n1.component);

    if (shouldUpdateComponent(n1, n2)) {
      console.log("should update");
      instance.next = n2;
      instance.update();
    } else {
      n2.component = n1.component;
      n2.el = n1.el;
      instance.vnode = n2;
    }
  }

  // 处理 render 函数，还有 update 逻辑
  function setupRenderEffect(
    instance,
    initialVNode: Vnode,
    container: HTMLElement
  ) {
    // 当更新时调用此函数
    function componentUpdateFn() {
      if (!instance.isMounted) {
        // 组件初始化的时候调用
        // 在此调用 render 函数收集依赖
        console.log("调用render,获取 subTree");
        // 获取 ctx 对象的代理
        const proxyToUse = instance.proxy;
        // 根据 AST 生成的 虚拟DOM 树
        const subTree = (instance.subTree = normalizeVnode(
          instance.render.call(proxyToUse, proxyToUse)
        ));
        console.log("subTree", subTree);

        // todo
        console.log("触发 beforeMount hook");
        // 将生成的虚拟DOM挂载在 container下
        patch(null, subTree, container, null, instance);

        // 将组件的 rootElement 赋值给 vnode.el,便于后续通过 $el 调用
        initialVNode.el = subTree.el;

        console.log("触发mounted hook");
        instance.isMounted = true;
      } else {
        console.log("调用更新逻辑");

        const { next, vnode } = instance;

        // 如果有 next 代表有需要更新的数据，如果没有则代表 props之类的数据不需要更新，只需要更新视图
        if (next) {
          next.el = vnode.el;
          updateComponentPreRender(instance, next);
        }

        const proxyToUse = instance.proxy;
        // 再次调用 render 生成新的 subTree
        const nextTree = normalizeVnode(
          instance.render.call(proxyToUse, proxyToUse)
        );

        const preTree = instance.subTree;
        instance.subTree = nextTree;

        console.log("触发 beforeUpdate hook");

        patch(preTree, nextTree, preTree.el, null, instance);

        console.log("触发 updated hook");
      }
    }

    instance.update = effect(componentUpdateFn, {
      scheduler: () => {
        // 把 effect 推到微任务中
        queueJob(instance.job);
      },
    });
  }

  // 更新前的预处理
  function updateComponentPreRender(instance, next) {
    // 替换 component
    next.component = instance;
    // 替换 vnode
    instance.vnode = next;
    // 将下一个节点置空
    instance.next = null;

    const { props } = next;
    instance.props = props;
    // todo 更新 slots
  }

  function processComponent(n1, n2, container, parentComponent) {
    if (!n1) {
      mountComponent(n2, container, parentComponent);
    } else {
      updateComponent(n1, n2, container);
    }
  }

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

  return {
    render,
    createApp: createAppAPI(render)
  }
}

// 获取最长递增子序列，Vue3通过比较最长递增子序列来确定哪些 DOM 在变更前后是不需要移动的
// 比如结果是 [0,2,3]
// 那么就代表新节点中处于这些索引的元素不需要进行移动
function getSequence(arr: Array<number>) {
  const p = arr.slice(); //  保存原始数据
  const result = [0]; //  存储最长增长子序列的索引数组
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1]; //  j是子序列索引最后一项
      if (arr[j] < arrI) {
        //  如果arr[i] > arr[j], 当前值比最后一项还大，可以直接push到索引数组(result)中去
        p[i] = j; //  p记录第i个位置的索引变为j
        result.push(i);
        continue;
      }
      u = 0; //  数组的第一项
      v = result.length - 1; //  数组的最后一项
      while (u < v) {
        //  如果arrI <= arr[j] 通过二分查找，将i插入到result对应位置；u和v相等时循环停止
        c = ((u + v) / 2) | 0; //  二分查找
        if (arr[result[c]] < arrI) {
          u = c + 1; //  移动u
        } else {
          v = c; //  中间的位置大于等于i,v=c
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]; //  记录修改的索引
        }
        result[u] = i; //  更新索引数组(result)
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  //把u值赋给result
  while (u-- > 0) {
    //  最后通过p数组对result数组进行进行修订，取得正确的索引
    result[u] = v;
    v = p[v];
  }
  return result;
}
