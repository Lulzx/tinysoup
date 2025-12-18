import type { Node, Element, TextNode, CommentNode, DoctypeNode, PrettifyOptions } from './types';
import { escapeAttr } from './parser';

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

export function prettify(el: Element, options: PrettifyOptions = {}): string {
  const { indent = '  ', newline = '\n' } = options;

  function format(node: Node, depth: number): string {
    const prefix = indent.repeat(depth);

    if (node.type === 'text') {
      const content = (node as TextNode).content.trim();
      return content ? prefix + content + newline : '';
    }
    if (node.type === 'comment') {
      return prefix + `<!--${(node as CommentNode).content}-->` + newline;
    }
    if (node.type === 'doctype') {
      return prefix + `<!DOCTYPE ${(node as DoctypeNode).content}>` + newline;
    }

    const element = node as Element;
    if (element.tagName === '#document') {
      return element.children.map(c => format(c, depth)).join('');
    }

    let html = prefix + `<${element.tagName}`;
    for (const [name, value] of element.attributes) {
      html += value === '' ? ` ${name}` : ` ${name}="${escapeAttr(value)}"`;
    }

    if (VOID_ELEMENTS.has(element.tagName)) return html + '>' + newline;

    html += '>';

    if (element.children.length === 1 && element.children[0].type === 'text') {
      const text = (element.children[0] as TextNode).content.trim();
      if (text && !text.includes('\n')) {
        return html + text + `</${element.tagName}>` + newline;
      }
    }

    html += newline;
    for (const child of element.children) {
      const childHtml = format(child, depth + 1);
      if (childHtml) html += childHtml;
    }
    return html + prefix + `</${element.tagName}>` + newline;
  }

  return format(el, 0);
}
