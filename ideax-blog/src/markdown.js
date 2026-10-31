import { Marked } from 'marked'
import { esc } from './html.js'

const safeUrl = (href) => (/^(https?:|mailto:|\/|#)/i.test(href || '') ? href : '#')

// Posts are written in Markdown. Raw HTML is shown as text and only safe link types are allowed.
const marked = new Marked({
  gfm: true,
  breaks: true,
  renderer: {
    html: ({ text }) => esc(text),
    link({ href, title, tokens }) {
      const external = /^https?:/i.test(href)
      return `<a href="${esc(safeUrl(href))}"${title ? ` title="${esc(title)}"` : ''}${
        external ? ' target="_blank" rel="noopener noreferrer"' : ''
      }>${this.parser.parseInline(tokens)}</a>`
    },
    image({ href, title, text }) {
      return `<img src="${esc(safeUrl(href))}" alt="${esc(text)}"${title ? ` title="${esc(title)}"` : ''} loading="lazy">`
    },
  },
})

export const renderMarkdown = (md) => marked.parse(md || '')

export function readingTime(md) {
  const words = (md || '').trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}
