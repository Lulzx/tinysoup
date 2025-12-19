import type { Node, Element, TextNode, CommentNode, DoctypeNode, SerializeOptions, OutputFormat } from '../types';
import { escapeHtml, escapeAttr } from './entities';

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

const BOOLEAN_ATTRIBUTES = new Set([
  'allowfullscreen', 'async', 'autofocus', 'autoplay', 'checked', 'controls',
  'default', 'defer', 'disabled', 'formnovalidate', 'hidden', 'ismap', 'loop',
  'multiple', 'muted', 'nomodule', 'novalidate', 'open', 'playsinline',
  'readonly', 'required', 'reversed', 'selected', 'truespeed'
]);

const RAW_TEXT_ELEMENTS = new Set(['script', 'style']);

function formatAttribute(name: string, value: string, format: OutputFormat): string {
  if (format === 'minimal') {
    if (BOOLEAN_ATTRIBUTES.has(name) && value === '') return ` ${name}`;
    if (!value.includes('"') && !value.includes(' ') && !value.includes('=') && value) {
      return ` ${name}=${value}`;
    }
  }

  if (format === 'xhtml') {
    if (BOOLEAN_ATTRIBUTES.has(name) && value === '') {
      return ` ${name}="${name}"`;
    }
  }

  if (format === 'html5' && BOOLEAN_ATTRIBUTES.has(name) && value === '') {
    return ` ${name}`;
  }

  return value === '' ? ` ${name}` : ` ${name}="${escapeAttr(value)}"`;
}

function formatVoidElement(tagName: string, format: OutputFormat): string {
  if (format === 'xhtml') return ' />';
  return '>';
}

export function serialize(node: Node, options: SerializeOptions = {}): string {
  const { format = 'default', selfClosingTags, emptyAttributes } = options;

  if (node.type === 'text') {
    const textNode = node as TextNode;
    const parentTag = textNode.parent?.tagName;
    if (parentTag && RAW_TEXT_ELEMENTS.has(parentTag)) return textNode.content;
    return escapeHtml(textNode.content);
  }

  if (node.type === 'comment') {
    return `<!--${(node as CommentNode).content}-->`;
  }

  if (node.type === 'doctype') {
    const content = (node as DoctypeNode).content;
    if (format === 'html5') return '<!DOCTYPE html>';
    if (format === 'xhtml') return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">';
    return `<!DOCTYPE ${content}>`;
  }

  const el = node as Element;

  if (el.tagName === '#document') {
    return el.children.map(c => serialize(c, options)).join('');
  }

  let html = `<${el.tagName}`;
  for (const [name, value] of el.attributes) {
    html += formatAttribute(name, value, format);
  }

  const isVoid = VOID_ELEMENTS.has(el.tagName);
  const useSelfClosing = selfClosingTags ?? (format === 'xhtml');

  if (isVoid) {
    return html + formatVoidElement(el.tagName, format);
  }

  if (useSelfClosing && el.children.length === 0) {
    return html + ' />';
  }

  html += '>';
  for (const child of el.children) {
    html += serialize(child, options);
  }
  html += `</${el.tagName}>`;

  return html;
}
