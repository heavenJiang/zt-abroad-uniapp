import { test } from "node:test"
import assert from "node:assert/strict"
import { pickCodes, parseScene } from "../src/utils/channel.js"
import { parseMarkdown, spans } from "../src/utils/markdown.js"
import { stepOf } from "../src/utils/progress.js"
import { requestId } from "../src/utils/uuid.js"

test("小程序码 scene：解码后取 ch / ct，地址参数优先", () => {
  assert.deepEqual(parseScene("ch%3Dxhs%26ct%3Dn1"), { ch: "xhs", ct: "n1" })
  assert.deepEqual(parseScene("ch=dy"), { ch: "dy" })
  assert.deepEqual(parseScene("%E0%A4%A"), {})
  assert.deepEqual(parseScene(undefined), {})
  assert.deepEqual(pickCodes({ scene: "ch%3Dxhs%26ct%3Dn1" }), { channelCode: "xhs", contentCode: "n1" })
  assert.deepEqual(pickCodes({ scene: "ch%3Dxhs", ch: "zhihu" }), { channelCode: "zhihu", contentCode: null })
})

test("协议全文解析为纯文本块", () => {
  assert.deepEqual(spans("您**点击同意**即表示"), [{ text: "您", bold: false }, { text: "点击同意", bold: true }, { text: "即表示", bold: false }])
  const md = "# 标题\n\n## 一、收集\n第一行\n第二行\n\n- 条目 **重点**\n1. 编号条目\n> 引用\n>\n---\n| 列1 | **列2** |\n| --- | :---: |\n| a | b |\n"
  const b = parseMarkdown(md)
  assert.deepEqual(b.map(x => x.type), ["h1", "h2", "p", "li", "li", "quote", "hr", "row", "row"])
  assert.deepEqual(b[2].spans, [{ text: "第一行第二行", bold: false }])
  assert.deepEqual(b[7].cells, ["列1", "列2"])
  assert.deepEqual(b[8].cells, ["a", "b"])
  assert.deepEqual(parseMarkdown(null), [])
  // 不产生任何 HTML：内容中的尖括号原样作为文本
  assert.equal(parseMarkdown("<script>x</script>")[0].spans[0].text, "<script>x</script>")
})

test("问卷进度：断点屏 → 第几步", () => {
  const def = { steps: [{ id: "goal", screens: [{ id: "goal_1" }] }, { id: "academic", screens: [{ id: "a_1" }, { id: "a_2" }] }, { id: "test" }] }
  assert.deepEqual(stepOf(def, "a_2"), { step: 2, total: 3 })
  assert.deepEqual(stepOf(def, ""), { step: 1, total: 3 })
  assert.deepEqual(stepOf(null, "x"), { step: 1, total: 0 })
})

test("请求ID 符合后端格式且不重复", () => {
  const a = requestId()
  assert.match(a, /^[A-Za-z0-9_-]{8,64}$/)
  assert.notEqual(a, requestId())
})
