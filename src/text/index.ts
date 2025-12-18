import type { Element, Node, TextNode, GetTextOptions } from '../types';

export function getText(el: Element, options: GetTextOptions = {}): string {
  const { separator = '', strip = false } = options;
  const pieces: string[] = [];

  function collect(node: Node): void {
    if (node.type === 'text') {
      const content = (node as TextNode).content;
      pieces.push(strip ? content.trim() : content);
    } else if (node.type === 'element') {
      for (const child of (node as Element).children) {
        collect(child);
      }
    }
  }

  collect(el);
  return strip ? pieces.filter(p => p).join(separator) : pieces.join(separator);
}

export function getString(el: Element): string | null {
  if (el.children.length === 1) {
    if (el.children[0].type === 'text') {
      return (el.children[0] as TextNode).content;
    }
    if (el.children[0].type === 'element') {
      return getString(el.children[0] as Element);
    }
  }
  return null;
}

export function* strippedStrings(el: Element): Generator<string> {
  for (const child of el.children) {
    if (child.type === 'text') {
      const stripped = (child as TextNode).content.trim();
      if (stripped) yield stripped;
    } else if (child.type === 'element') {
      yield* strippedStrings(child as Element);
    }
  }
}

export function* strings(el: Element): Generator<string> {
  for (const child of el.children) {
    if (child.type === 'text') {
      yield (child as TextNode).content;
    } else if (child.type === 'element') {
      yield* strings(child as Element);
    }
  }
}
