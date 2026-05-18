import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'

const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  typographer: true,
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs code-block"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`
      } catch { }
    }
    return `<pre class="hljs code-block"><code>${md.utils.escapeHtml(str)}</code></pre>`
  },
})

export function renderMarkdown(content) {
  if (!content) return ''
  return md.render(content)
}
