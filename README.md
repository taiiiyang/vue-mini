Vue-mini 初次实践
## reactivity
  1. 实现响应式，通过 proxy 和 reflect 进行代理，在代理过程中收集依赖，在 set 中触发依赖，
  2. 实现 unRef， toReactive
  3. 实现 ReactiveEffect 类，对副作用函数进行二次封装，通过调用其 run 方法来进行调用
  4. 实现 ref，通过 ImplRef 类对传进来的数据进行依赖收集，对其中的 value 进行代理
  5. 实现 track 和 trigger 函数，分别是依赖收集和触发 dep 依赖函数
  
## runtime
  1. 实现 createRenderer 方法，调用后生成一个渲染器，内部可以进行 mount 操作，用于将 render 函数生成的虚拟DOM转为真实DOM并挂载到页面上
  2. 实现 patch 方法，通过递归调用来为组件进行补丁操作
  3. 实现 patchKeyedChildren，Vue最为核心的快速Diff算法，用于对前后都是数组的children进行补丁操作，
  4. 实现 createComponentInstance 方法，传入配置能生成对应的组件实例
  5. 实现 scheduler ，根据不同情况进行组件的异步更新任务
  6. 实现 h 函数，根据配置创建虚拟DOM
  7. 实现 createAppAPI 函数，调用后生成 createApp 函数，通过其生成的mount方法，可进行组件的模板解析并将其生成的虚拟DOM递归通过 patch 挂载到对应根节点，在生成虚拟DOM的过程中进行依赖收集
  
## compiler-core ( compile -> parse -> transform -> codegen)
  1. 实现 parse 方法，用于将模板字符串转为 AST
  2. 实现 codegen 方法，用于将 JS AST 转为对应的代码字符串，并将其作为 render 函数
  3. todo： 实现transform 用于将不可识别的 Vue 语法转为可识别的 JS 代码
