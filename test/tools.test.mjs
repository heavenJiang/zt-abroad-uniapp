import { test } from "node:test"
import assert from "node:assert/strict"
import { validBand, validateIeltsForm, ieltsText, recognitionText, deadlineText, urgent } from "../src/utils/tools.js"

test("雅思分：0–9，0.5 一档", () => {
  for (const v of ["0", "6.5", 7, "9"]) assert.equal(validBand(v), true, String(v))
  for (const v of ["", null, "6.3", "9.5", "-1", "abc"]) assert.equal(validBand(v), false, String(v))
})

test("雅思够不够表单校验", () => {
  const ok = { total: "6.5", minSub: "6", countries: ["UK"], agreed: true }
  assert.equal(validateIeltsForm(ok, ["UK"]), "")
  assert.equal(validateIeltsForm({ ...ok, minSub: "" }, ["UK"]), "")
  assert.match(validateIeltsForm({ ...ok, total: "6.3" }, ["UK"]), /总分/)
  assert.match(validateIeltsForm({ ...ok, minSub: "6.2" }, ["UK"]), /最低小分应在/)
  assert.equal(validateIeltsForm({ ...ok, minSub: "7" }, ["UK"]), "最低小分不能高于总分")
  assert.equal(validateIeltsForm({ ...ok, countries: [] }, ["UK"]), "请选择目标国家 / 地区")
  assert.equal(validateIeltsForm({ ...ok, countries: ["US"] }, ["UK"]), "所选国家 / 地区暂未开放，请至少选一个已开放的")
  assert.equal(validateIeltsForm({ ...ok, agreed: false }, ["UK"]), "请先阅读并同意隐私政策")
})

test("雅思结果文案：差距、语言班、估算、待核实", () => {
  assert.equal(ieltsText({ outcome: "met", required: "雅思 6.5（小分 6.0）" }), "要求 雅思 6.5（小分 6.0）")
  assert.equal(ieltsText({ outcome: "not_met", required: "雅思 7.0（小分 6.5）", totalGap: 0.5, subGap: 0.5 }),
    "要求 雅思 7.0（小分 6.5），总分差 0.5、小分差 0.5")
  assert.equal(ieltsText({ outcome: "pre_sessional", required: "雅思 7.0", preSessionalUnverified: true, estimated: true }),
    "要求 雅思 7.0，可读语言班（项目是否接受待核实）（按同类院校一般要求估算）")
  assert.equal(ieltsText({ outcome: "unchecked", unverified: true }), "项目信息待核实，以官网为准")
  assert.equal(ieltsText({ outcome: "unchecked" }), "院校库暂未录入语言要求，以官网为准")
})

test("本校认可度文案", () => {
  assert.equal(recognitionText({ status: "accepted", gpaRequired: "≥ 80" }), "接收，均分要求 ≥ 80")
  assert.equal(recognitionText({ status: "accepted", gpaRequired: "官网不设均分线" }), "接收，官网不设均分线")
  assert.equal(recognitionText({ status: "accepted", gpaRequired: "≥ 85", estimated: true }), "接收，均分要求 ≥ 85（按同类院校一般要求估算）")
  assert.equal(recognitionText({ status: "accepted", unverified: true }), "接收；均分要求待核实，以官网为准")
  assert.equal(recognitionText({ status: "not_accepted" }), "不接收你所在院校背景的申请")
})

test("截止文案与紧迫提示", () => {
  const p = { nextRound: "R2", nextDeadline: "2026-12-01", daysLeft: 46, roundsLeft: 2, rolling: false }
  assert.equal(deadlineText(p), "R2 截止 2026-12-01（还剩 46 天），之后还有 1 轮")
  assert.equal(deadlineText({ ...p, daysLeft: 0, roundsLeft: 1, nextRound: null }), "截止 2026-12-01（今天截止）")
  assert.equal(deadlineText({ nextDeadline: null, rolling: true }), "滚动录取，额满即止，建议尽早递交")
  assert.equal(deadlineText({ unverified: true }), "截止日待核实，以官网为准")
  assert.equal(urgent({ ...p, daysLeft: 30 }), true)
  assert.equal(urgent(p), false)
  assert.equal(urgent({ unverified: true, daysLeft: 1 }), false)
})
