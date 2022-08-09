/**
 * 
 * Vue 的组件更新，异步任务，响应式数据更新并不是同步更新的，而是异步更新的
 * 在多次连续更新时，Vue会将其储存到队列中，由调度器进行按顺序更新
 * 只有不再进行更新了，所有异步任务才会执行，这样就避免了多次修改同一个值造成的性能损耗
 * 
 */




const queue: Array<any> = []
const activePreFlushCbs = []

const p = Promise.resolve()
let isFlushPending = false

// nextTick 是用于在下一次DOM更新完成之后进行调度，所以只需要将回调放入微任务队列最后即可
export function nextTick(fn) {
    return fn ? p.then(fn) : p
}

// 加入更新队列， 组件更新执行
export function queueJob(job) {
    if (!queue.includes(job)) {
        queue.push(job)
        // 执行全部
        queueFlush()
    }
}

function queueFlush() {
  // 如果同时触发了两个组件的更新的话
  // 这里就会触发两次 then （微任务逻辑）
  // 但是着是没有必要的
  // 我们只需要触发一次即可处理完所有的 job 调用
  // 所以需要判断一下 如果已经触发过 nextTick 了
  // 那么后面就不需要再次触发一次 nextTick 逻辑了

  if (isFlushPending) return 
  isFlushPending = true
  nextTick(flushJobs())
}

function flushJobs() {
    isFlushPending = false

    // 先执行 pre 类型的 jobs
}


