/**
 * 协议全文（Markdown）→ 段落块，按纯文本展示（不生成 HTML，页面不用 v-html）
 *
 * 支持：# / ## / ### 标题、段落、- 或 1. 列表、> 引用、| 表格行（分隔行忽略）、--- 分隔线、**加粗**。
 * 每块的 spans 是 [{text, bold}]，页面用 <text> 逐段显示。
 */

/**
 * 解析行内加粗
 *
 * @param {string} line
 * @returns {{text: string, bold: boolean}[]}
 */
export function spans(line) {
  const out = []
  const parts = line.split("**")
  parts.forEach((part, i) => {
    if (part) {
      out.push({ text: part, bold: i % 2 === 1 })
    }
  })
  return out
}

/**
 * 解析全文
 *
 * @param {string} markdown
 * @returns {{type: string, spans?: {text: string, bold: boolean}[], cells?: string[]}[]}
 */
export function parseMarkdown(markdown) {
  const blocks = []
  let para = []
  const flush = () => {
    if (para.length) {
      blocks.push({ type: "p", spans: spans(para.join("")) })
      para = []
    }
  }
  for (const raw of String(markdown || "").split(/\r?\n/)) {
    const line = raw.trim()
    let m
    if (!line) {
      flush()
    } else if ((m = line.match(/^(#{1,3})\s+(.*)$/))) {
      flush()
      blocks.push({ type: "h" + m[1].length, spans: spans(m[2]) })
    } else if (/^-{3,}$/.test(line)) {
      flush()
      blocks.push({ type: "hr" })
    } else if ((m = line.match(/^(?:[-*]|\d+\.)\s+(.*)$/))) {
      flush()
      blocks.push({ type: "li", spans: spans(m[1]) })
    } else if ((m = line.match(/^>\s?(.*)$/))) {
      flush()
      if (m[1]) {
        blocks.push({ type: "quote", spans: spans(m[1]) })
      }
    } else if (line.startsWith("|")) {
      flush()
      const cells = line.replace(/^\||\|$/g, "").split("|").map(c => c.trim().replace(/\*\*/g, ""))
      if (!cells.every(c => /^:?-{2,}:?$/.test(c))) {
        blocks.push({ type: "row", cells })
      }
    } else {
      para.push(line)
    }
  }
  flush()
  return blocks
}
