import { test } from "node:test"
import assert from "node:assert/strict"
import { validateQuick, buildAnswers, formFromAnswers, gapText, keyGapText, tieredCount, NOTICE_TEXTS } from "../src/utils/quick.js"

const scales = [
  { value: "percent", total: { min: 0, max: 100 } },
  { value: "gpa4", total: { min: 0, max: 4 } },
  { value: "other", total: { min: 0 }, requires_max: true }
]
const ok = {
  school: { kind: "cn", university_id: 3, name: "北京航空航天大学" },
  gpaType: "percent", gpaTotal: "85", gpaMax: "",
  countries: ["UK"], field: "finance", agreed: true
}
const opts = { scales, openCountries: ["UK", "HK"] }

test("快测表单校验：逐项给出第一个错误", () => {
  assert.equal(validateQuick(ok, opts), "")
  assert.equal(validateQuick({ ...ok, school: null }, opts), "请选择本科学校")
  assert.equal(validateQuick({ ...ok, school: { kind: "cn" } }, opts), "请从搜索结果中选择本科学校")
  assert.equal(validateQuick({ ...ok, school: { kind: "overseas" } }, opts), "")
  assert.equal(validateQuick({ ...ok, gpaTotal: "" }, opts), "请填写均分 / GPA")
  assert.equal(validateQuick({ ...ok, gpaTotal: "abc" }, opts), "请填写均分 / GPA")
  assert.equal(validateQuick({ ...ok, gpaTotal: "101" }, opts), "均分 / GPA 不在合理范围内")
  assert.equal(validateQuick({ ...ok, gpaType: "gpa4", gpaTotal: "4.5" }, opts), "均分 / GPA 不在合理范围内")
  assert.equal(validateQuick({ ...ok, gpaType: "other", gpaTotal: "8" }, opts), "请填写满分")
  assert.equal(validateQuick({ ...ok, gpaType: "other", gpaTotal: "8", gpaMax: "10" }, opts), "")
  assert.equal(validateQuick({ ...ok, countries: [] }, opts), "请选择目标国家 / 地区")
  assert.equal(validateQuick({ ...ok, countries: ["US"] }, opts), "所选国家 / 地区暂未开放快测，请至少选一个已开放的")
  assert.equal(validateQuick({ ...ok, countries: ["US", "HK"] }, opts), "")
  assert.equal(validateQuick({ ...ok, field: "" }, opts), "请选择专业方向")
  assert.equal(validateQuick({ ...ok, agreed: false }, opts), "请先阅读并同意隐私政策")
})

test("表单 → 问卷格式答案；再还原为表单", () => {
  const a = buildAnswers(ok)
  assert.deepEqual(a, {
    undergrad_school: { kind: "cn", university_id: 3, name: "北京航空航天大学" },
    gpa: { type: "percent", total: 85 },
    target_countries: ["UK"],
    target_field: "finance"
  })
  assert.deepEqual(buildAnswers({ ...ok, school: { kind: "overseas", university_id: 9 } }).undergrad_school,
    { kind: "overseas", university_id: null, name: "" })
  assert.deepEqual(buildAnswers({ ...ok, gpaType: "other", gpaTotal: "8.5", gpaMax: "10" }).gpa, { type: "other", total: 8.5, max: 10 })
  const f = formFromAnswers(a)
  assert.deepEqual(f, { school: ok.school, gpaType: "percent", gpaTotal: "85", gpaMax: "", countries: ["UK"], field: "finance" })
  assert.deepEqual(formFromAnswers(null), {})
  assert.deepEqual(formFromAnswers({ target_countries: ["UK", 3] }), { countries: ["UK"] })
})

test("差距文案：不展示院校层次，估算的要求注明", () => {
  assert.equal(gapText({ item: "gpa", required: "≥ 87", actual: "85", estimated: false }), "均分：要求 ≥ 87，你 85")
  assert.equal(gapText({ item: "gpa", required: "≥ 80", actual: "75", estimated: true }), "均分：要求 ≥ 80，你 75（按同类院校一般要求估算）")
  assert.equal(gapText({ item: "tier_accepted", required: null, actual: null, estimated: true }), "本科院校背景：该项目对本科院校有限制")
  assert.equal(keyGapText({ item: "gpa", programCount: 3, required: "≥ 85", actual: "82" }), "3 个项目的均分要求高于你目前的均分（最容易达到的一条要求 ≥ 85，你目前 82）")
  assert.equal(keyGapText({ item: "tier_accepted", programCount: 2 }), "2 个项目对本科院校有限制")
  assert.equal(keyGapText({ item: "language_en", programCount: 1 }), "1 个项目的英语成绩暂未达到")
})

test("快测提示文案与任务卡一致；可申项目数", () => {
  assert.equal(NOTICE_TEXTS.quick_academic_only, "仅按院校层次和均分估算，未计入科研、实习、标化")
  const r = { countries: [{ tiers: [{ count: 2 }, { count: 3 }, { count: 1 }] }, { tiers: [{ count: 0 }, { count: 1 }, { count: 0 }] }] }
  assert.equal(tieredCount(r), 7)
  assert.equal(tieredCount(null), 0)
})
