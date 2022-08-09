import { createVnode } from "./vnode"
export const h = (type: any, props: any = null, children: string | Array<any> = []) => 
    createVnode(type, props, children)