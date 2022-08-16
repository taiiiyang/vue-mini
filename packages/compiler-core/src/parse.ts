/**
 *
 * 将模板字符串转为 AST
 *
 */

import { NodeTypes, ElementTypes, RootNode } from "./ast";

const enum TagType {
  Start,
  End,
}

interface Context {
  source: string;
}

export function baseParse(content: string) {
  const ctx = createParseContext(content);
  return createRoot(parseChildren(ctx, []));
}

function createParseContext(content: string): Context {
  return {
    source: content,
  };
}

function parseChildren(ctx: Context, ancestors: any[]) {
  // 解析子节点,遇到不同标签，状态进行转移
  // 使用 nodes 存储各种节点
  // 遇到开始节点，进入 parseChildren 过程，将当前 tag 存入ancestors栈并传入
  // 如果一切正常，则代表必定会有一个匹配的节点跟栈中最后一个相同
  // 如果遇到祖先元素的最后一个元素就代表子节点已经转换完毕
  // 就可以将 ancestors 最后一个元素移除，也就是出栈
  const nodes:Array<Object> = [];

  while (!isEnd(ctx, ancestors)) {
    let node = {};
    const s = ctx.source;

    if (startsWith(s, "{{")) {
      node = parseInterpolation(ctx);
    } else if (s[0] === "<") {
      if (s[1] === "/") {
        // 如果是结束标签则不需要放入 ancestors 往后移动即可
        if (/[a-z]/i.test(s[2])) {
          parseTag(ctx, TagType.End);
          continue;
        }
      } else if (/[a-z]/i.test(s[1])) {
        node = parseElement(ctx, ancestors);
      }
    }

    if (!node) {
        // 如果都不是那么就代表解析文本
        node = parseText(ctx)
    }

    nodes.push(node)
  }

  return {};
}
// 递归解析 children 并将整颗数返回
function createRoot(children):RootNode {
    return {
        type: NodeTypes.ROOT,
        children,
        helpers:[]
    }
}

function parseText(context:Context) {
    console.log("解析 text", context);

    // endIndex 应该看看有没有对应的 <
    // 比如 hello</div>
    // 像这种情况下 endIndex 就应该是在 o 这里
    // {
    const endTokens = ["<", "{{"];
    let endIndex = context.source.length;
  
    for (let i = 0; i < endTokens.length; i++) {
      const index = context.source.indexOf(endTokens[i]);
      // endIndex > index 是需要要 endIndex 尽可能的小
      // 比如说：
      // hi, {{123}} <div></div>
      // 那么这里就应该停到 {{ 这里，而不是停到 <div 这里
      if (index !== -1 && endIndex > index) {
        endIndex = index;
      }
    }
  
    const content = parseTextData(context, endIndex);
  
    return {
      type: NodeTypes.TEXT,
      content,
    };
}

function parseTag(context: Context, type: TagType) {
  const match = /^<\/?([a-z][^\r\n\t\f />]*)/.exec(context.source);
  if (match) {
    const tag = match[1];
    // <div
    // 移动
    advanceBy(context, match[0].length);
    advanceBy(context, 1);

    if (TagType.End === type) return;

    let tagType = ElementTypes.ELEMENT;

    return {
      tag,
      tagType,
      type: NodeTypes.ELEMENT,
      children: {},
    };
  }
}

function parseElement(context: Context, ancestors) {
  // 获取对应标签的对象，包含子节点和对应层级关系
  const element = parseTag(context, TagType.Start);

  if (element) {
    ancestors.push(element);
    const children = parseChildren(context, ancestors);
    ancestors.pop();

    if (startsWithEndTagOpen(context.source, element.tag)) {
      parseTag(context, TagType.End);
      // 消除结束标签
    } else {
      throw new Error("缺失结束标签");
    }

    element.children = children;
    return element;
  } else {
    return {

    }
  }
}

function parseInterpolation(context: Context) {
  // 动态内容
  const openDelimiter = "{{";
  const closeDelimiter = "}}";

  const closeIndex = context.source.indexOf(
    closeDelimiter,
    openDelimiter.length
  );

  if (closeIndex == -1) console.error("插值语法错误");

  advanceBy(context, openDelimiter.length);

  const rawContentLength = closeIndex - openDelimiter.length;
  const rawContent = context.source.slice(0, rawContentLength);

  // 获取实际字符串
  const preTrimContent = parseTextData(context, rawContentLength);
  // 去除 }}
  advanceBy(context, 2);
  const content = preTrimContent.trim();
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
    },
  };
}

function parseTextData(context: Context, length: number) {
  const rawText = context.source.slice(0, length);
  // 移动文本的距离
  advanceBy(context, length);
  return rawText;
}

function isEnd(context: Context, ancestors: any[]) {
  // 检测是否是结束标签
  const s = context.source;

  if (s.startsWith("</")) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      if (startsWithEndTagOpen(s, ancestors[i].tag)) {
        return true;
      }
    }
  }

  return !context.source;
}

function startsWithEndTagOpen(s: string, tag: string): boolean {
  // 判断是不是跟节点相同的结束标签
  return (
    startsWith(s, "</") &&
    s.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
  );
}

// 代码推进
function advanceBy(context: Context, numberOfCharacters: number) {
  context.source = context.source.slice(numberOfCharacters);
}
function startsWith(source: string, searchString: string): boolean {
  return source.startsWith(searchString);
}
