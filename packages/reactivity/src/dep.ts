// 用于存储所有的 effect 相关的依赖
// 用 set 存储 effect 是为了防止依赖重复
export function createDep(effects?) {
    const dep = new Set(effects)
    return dep
}