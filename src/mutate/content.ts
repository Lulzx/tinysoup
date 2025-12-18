import type { Element, Node, TextNode, CommentNode, NewTagOptions } from '../types';
import { parse } from '../parser';

export function newTag(tagName: string, options: NewTagOptions = {}): Element {
  const el: Element = {
    type: 'element',
    tagName: tagName.toLowerCase(),
    attributes: new Map(),
    children: [],
    parent: null,
  };

  if (options.attrs) {
    for (const [name, value] of Object.entries(options.attrs)) {
      el.attributes.set(name, value);
      if (name === 'id') el.id = value;
      if (name === 'class') {
        el.classList = new Set(value.split(/\s+/).filter(Boolean));
      }
    }
  }

  if (options.children) {
    for (const child of options.children) {
      if (typeof child === 'string') {
        const textNode: TextNode = { type: 'text', content: child, parent: el };
        el.children.push(textNode);
      } else {
        if (child.parent) remove(child);
        child.parent = el;
        el.children.push(child);
      }
    }
  }

  return el;
}

export function createTextNode(content: string): TextNode {
  return { type: 'text', content, parent: null };
}

export function createComment(content: string): CommentNode {
  return { type: 'comment', content, parent: null };
}

export function setText(el: Element, text: string): Element {
  el.children = [{ type: 'text', content: text, parent: el } as TextNode];
  return el;
}

export function setInnerHtml(el: Element, html: string): Element {
  const doc = parse(html);
  for (const child of doc.children) child.parent = el;
  el.children = doc.children;
  return el;
}

export function append(el: Element, content: string | Element): Element {
  if (typeof content === 'string') {
    const doc = parse(content);
    for (const child of doc.children) {
      child.parent = el;
      el.children.push(child);
    }
  } else {
    if (content.parent) remove(content);
    content.parent = el;
    el.children.push(content);
  }
  return el;
}

export function prepend(el: Element, content: string | Element): Element {
  if (typeof content === 'string') {
    const doc = parse(content);
    for (let i = doc.children.length - 1; i >= 0; i--) {
      doc.children[i].parent = el;
      el.children.unshift(doc.children[i]);
    }
  } else {
    if (content.parent) remove(content);
    content.parent = el;
    el.children.unshift(content);
  }
  return el;
}

export function insert(el: Element, position: number, content: string | Element | Node): Element {
  const idx = position < 0 ? Math.max(0, el.children.length + position + 1) : Math.min(position, el.children.length);

  if (typeof content === 'string') {
    const doc = parse(content);
    for (let i = 0; i < doc.children.length; i++) {
      doc.children[i].parent = el;
      el.children.splice(idx + i, 0, doc.children[i]);
    }
  } else {
    if (content.type === 'element' && (content as Element).parent) {
      remove(content as Element);
    }
    content.parent = el;
    el.children.splice(idx, 0, content);
  }
  return el;
}

export function remove(el: Element): Element {
  if (el.parent) {
    const idx = el.parent.children.indexOf(el);
    if (idx !== -1) el.parent.children.splice(idx, 1);
    el.parent = null;
  }
  return el;
}

export function empty(el: Element): Element {
  for (const child of el.children) child.parent = null;
  el.children = [];
  return el;
}

export function clone(el: Element, deep: boolean = true): Element {
  const cloned: Element = {
    type: 'element',
    tagName: el.tagName,
    attributes: new Map(el.attributes),
    children: [],
    parent: null,
    id: el.id,
    classList: el.classList ? new Set(el.classList) : undefined,
  };

  if (deep) {
    for (const child of el.children) {
      const childClone = cloneNode(child);
      childClone.parent = cloned;
      cloned.children.push(childClone);
    }
  }

  return cloned;
}

function cloneNode(node: Node): Node {
  if (node.type === 'text') {
    return { type: 'text', content: (node as TextNode).content, parent: null } as TextNode;
  }
  if (node.type === 'comment') {
    return { type: 'comment', content: (node as CommentNode).content, parent: null } as CommentNode;
  }
  if (node.type === 'element') {
    return clone(node as Element);
  }
  return { ...node, parent: null };
}

export function decompose(el: Element): void {
  if (el.parent) {
    const idx = el.parent.children.indexOf(el);
    if (idx !== -1) el.parent.children.splice(idx, 1);
  }
  el.parent = null;
  el.children = [];
  el.attributes.clear();
}

export function smooth(el: Element): Element {
  const newChildren: Node[] = [];
  for (const child of el.children) {
    if (child.type === 'text') {
      const last = newChildren[newChildren.length - 1];
      if (last?.type === 'text') {
        (last as TextNode).content += (child as TextNode).content;
      } else {
        newChildren.push(child);
      }
    } else {
      if (child.type === 'element') smooth(child as Element);
      newChildren.push(child);
    }
  }
  el.children = newChildren;
  return el;
}
