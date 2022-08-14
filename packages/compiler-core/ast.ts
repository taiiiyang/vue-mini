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
    loc: SourceLocation
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