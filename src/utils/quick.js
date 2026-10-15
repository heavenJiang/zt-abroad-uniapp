/**
 * 30 秒快测：表单校验、答案组装、结果文案（纯函数，便于单元测试）
 *
 * 结果文案只使用后端返回的档位、代表校与差距；不出现录取概率、分数线等内部数字。
 */

/** 本机已同意的隐私政策版本（入口工具据此自动勾选；后端仍按版本校验） */
export const CONSENT_KEY = "abr_consent_version"

/** 档位名称 */
export const TIER_LABELS = {
  reach: "冲刺",
  match: "稳妥",
  safety: "保底",
  unrated: "待定档",
  needs_improvement: "补足后可申"
}

/** 提示码 → 学生可见文案（quick_academic_only 文案见任务卡 M4-02） */
export const NOTICE_TEXTS = {
  quick_academic_only: "仅按院校层次和均分估算，未计入科研、实习、标化",
  school_not_found: "没有找到你的学校，结果按较保守的口径估算"
}

/** 未达标项名称 */
export const ITEM_LABELS = {
  gpa: "均分",
  tier_accepted: "本科院校背景",
  language_en: "英语成绩",
  language_ja: "日语成绩",
  language_ko: "韩语成绩",
  language_de: "德语成绩"
}

/** 方案提示 */
export const HINT_TEXTS = {
  mix_application: "保底项目偏少，建议同时申请其他国家 / 地区",
  no_safety_in_first_choice: "首选国家 / 地区暂时没有保底项目，建议补充保底"
}

/**
 * 校验快测表单
 *
 * @param {object} form {school, gpaType, gpaTotal, gpaMax, countries, field, agreed}
 * @param {object} [opts] {scales: score_types[], openCountries: string[]}
 * @returns {string} 错误提示；通过为空串
 */
export function validateQuick(form, opts = {}) {
  if (!form.school || !form.school.kind) {
    return "请选择本科学校"
  }
  if (form.school.kind === "cn" && !form.school.university_id) {
    return "请从搜索结果中选择本科学校"
  }
  const total = Number(form.gpaTotal)
  if (form.gpaTotal === "" || form.gpaTotal == null || Number.isNaN(total)) {
    return "请填写均分 / GPA"
  }
  const scale = (opts.scales || []).find(s => s.value === form.gpaType)
  if (scale) {
    let max = scale.total && scale.total.max
    if (scale.requires_max) {
      const m = Number(form.gpaMax)
      if (form.gpaMax === "" || form.gpaMax == null || Number.isNaN(m) || m <= 0) {
        return "请填写满分"
      }
      max = m
    }
    if (total < 0 || (max != null && total > max)) {
      return "均分 / GPA 不在合理范围内"
    }
  }
  if (!form.countries || !form.countries.length) {
    return "请选择目标国家 / 地区"
  }
  if (opts.openCountries && !form.countries.some(c => opts.openCountries.includes(c))) {
    return "所选国家 / 地区暂未开放快测，请至少选一个已开放的"
  }
  if (!form.field) {
    return "请选择专业方向"
  }
  if (!form.agreed) {
    return "请先阅读并同意隐私政策"
  }
  return ""
}

/**
 * 表单 → 接口答案（格式与问卷一致）
 *
 * @param {object} form 表单
 * @returns {object} 题目 id → 答案
 */
export function buildAnswers(form) {
  const gpa = { type: form.gpaType, total: Number(form.gpaTotal) }
  if (form.gpaMax !== "" && form.gpaMax != null && form.gpaType === "other") {
    gpa.max = Number(form.gpaMax)
  }
  return {
    undergrad_school: {
      kind: form.school.kind,
      university_id: form.school.kind === "cn" ? form.school.university_id : null,
      name: form.school.name || ""
    },
    gpa,
    target_countries: [...form.countries],
    target_field: form.field
  }
}

/**
 * 访客档案（上次填写的答案）→ 表单初值
 *
 * @param {object} answers 题目 id → 答案
 * @returns {object} 表单字段（没有的不返回）
 */
export function formFromAnswers(answers) {
  const out = {}
  if (!answers) {
    return out
  }
  const s = answers.undergrad_school
  if (s && s.kind) {
    out.school = { kind: s.kind, university_id: s.university_id || null, name: s.name || "" }
  }
  const g = answers.gpa
  if (g && g.type) {
    out.gpaType = g.type
    out.gpaTotal = g.total == null ? "" : String(g.total)
    out.gpaMax = g.max == null ? "" : String(g.max)
  }
  if (Array.isArray(answers.target_countries)) {
    out.countries = answers.target_countries.filter(c => typeof c === "string")
  }
  if (typeof answers.target_field === "string") {
    out.field = answers.target_field
  }
  return out
}

/**
 * 未达标项文案，如“均分：要求 ≥ 87，你 85”；院校背景不展示具体层次
 *
 * @param {{item: string, required: string|null, actual: string|null, estimated: boolean}} gap
 * @returns {string}
 */
export function gapText(gap) {
  const label = ITEM_LABELS[gap.item] || "其他要求"
  if (gap.item === "tier_accepted") {
    return label + "：该项目对本科院校有限制"
  }
  let text = label
  if (gap.required) {
    text += "：要求 " + gap.required
    if (gap.actual) {
      text += "，你 " + gap.actual
    }
  }
  if (gap.estimated) {
    text += "（按同类院校一般要求估算）"
  }
  return text
}

/**
 * 关键差距文案
 *
 * @param {{item: string, programCount: number, required: string|null, actual: string|null}} k
 * @returns {string}
 */
export function keyGapText(k) {
  if (k.item === "gpa") {
    const detail = k.required ? "（最容易达到的一条要求 " + k.required + (k.actual ? "，你目前 " + k.actual : "") + "）" : ""
    return k.programCount + " 个项目的均分要求高于你目前的均分" + detail
  }
  if (k.item === "tier_accepted") {
    return k.programCount + " 个项目对本科院校有限制"
  }
  return k.programCount + " 个项目的" + (ITEM_LABELS[k.item] || "其他要求") + "暂未达到"
}

/**
 * 结果中一共能申（冲 + 稳 + 保）的项目数
 *
 * @param {object} result 快测结果
 * @returns {number}
 */
export function tieredCount(result) {
  return (result && result.countries ? result.countries : [])
    .reduce((sum, c) => sum + c.tiers.reduce((s, t) => s + t.count, 0), 0)
}
