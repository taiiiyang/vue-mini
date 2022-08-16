import { Context } from "./codegen"
import { CREATE_ELEMENT_VNODE } from "./runtimeHelpers"

export const enum NodeTypes {
    TEXT,
    ROOT,
    INTERPOLATION, //动态节点
    SIMPLE_EXPRESSION,
    ELEMENT,
    COMPOUND_EXPRESSION,
    ATTRIBUTE
}

export const enum ElementTypes {
    ELEMENT
}

export interface Node {
    type: NodeTypes,
}


export interface RootNode extends Node {
    type: NodeTypes.ROOT
    helpers: symbol[]
    components?: string[]
    codegenNode?
    children?
}

export interface TextNode extends Node {
    type: NodeTypes.TEXT
    content: string
}

export interface AttributeNode extends Node {
    type: NodeTypes.ATTRIBUTE
    name: string
    value: TextNode | undefined
}

export interface SourceLocation {
    start: Position
    end: Position
    source: string
}

export interface Position {
    offset: number
    line: number
    column: number
}

export interface BaseElementNode extends Node {
    type: NodeTypes.ELEMENT
    tag: string
    props: Array<any>
    children: Array<AttributeNode>
}

export function createInterpolation(content) {
    return {
        type: NodeTypes.INTERPOLATION,
        content
    }
}

export function createSimpleExpression(content) {
    return {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content
    }
}

export function createVNodeCall(context:Context, tag, props?, children?) {

    if (context) {
        context.helper(CREATE_ELEMENT_VNODE)
    }
    return {
        tag,
        type: NodeTypes.ELEMENT,
        props,
        children
    }
}