/**
 * 查询类入口工具（本校认可度、雅思够不够、现在还能申）：表单校验与结果文案（纯函数，便于单元测试）
 */

/** 雅思结论名称 */
export const IELTS_OUTCOMES = {
  met: "达标",
  pre_sessional: "读语言班可达标",
  not_met: "未达标",
  unchecked: "无法判断"
}

/**
 * 雅思分校验：0–9，0.5 一档
 *
 * @param {string|number} v 输入
 * @returns {boolean}
 */
export function validBand(v) {
  if (v === "" || v == null) {
    return false
  }
  const x = Number(v)
  return !Number.isNaN(x) && x >= 0 && x <= 9 && Math.round(x * 2) === x * 2
}

/**
 * 雅思够不够表单校验
 *
 * @param {object} form {total, minSub, countries, agreed}
 * @param {string[]} openCountries 已开放的国家 / 地区
 * @returns {string} 错误提示；通过为空串
 */
export function validateIeltsForm(form, openCountries) {
  if (!validBand(form.total)) {
    return "请填写雅思总分（0–9，以 0.5 为一档）"
  }
  if (form.minSub !== "" && form.minSub != null) {
    if (!validBand(form.minSub)) {
      return "最低小分应在 0–9 之间，以 0.5 为一档"
    }
    if (Number(form.minSub) > Number(form.total)) {
      return "最低小分不能高于总分"
    }
  }
  if (!form.countries || !form.countries.length) {
    return "请选择目标国家 / 地区"
  }
  if (openCountries && !form.countries.some(c => openCountries.includes(c))) {
    return "所选国家 / 地区暂未开放，请至少选一个已开放的"
  }
  if (!form.agreed) {
    return "请先阅读并同意隐私政策"
  }
  return ""
}

/**
 * 雅思够不够：单个项目的说明
 *
 * @param {object} p 项目结果
 * @returns {string}
 */
export function ieltsText(p) {
  if (p.unverified) {
    return "项目信息待核实，以官网为准"
  }
  if (p.outcome === "unchecked") {
    return "院校库暂未录入语言要求，以官网为准"
  }
  let text = "要求 " + p.required
  if (p.outcome === "not_met") {
    const gaps = []
    if (p.totalGap) {
      gaps.push("总分差 " + p.totalGap)
    }
    if (p.subGap) {
      gaps.push("小分差 " + p.subGap)
    }
    if (gaps.length) {
      text += "，" + gaps.join("、")
    }
  }
  if (p.outcome === "pre_sessional") {
    text += "，可读语言班" + (p.preSessionalUnverified ? "（项目是否接受待核实）" : "")
  }
  if (p.estimated) {
    text += "（按同类院校一般要求估算）"
  }
  return text
}

/**
 * 本校认可度：单个项目的说明
 *
 * @param {object} p 项目结果
 * @returns {string}
 */
export function recognitionText(p) {
  if (p.status === "not_accepted") {
    return "不接收你所在院校背景的申请" + (p.estimated ? "（按同类院校一般要求估算）" : "")
  }
  if (p.unverified) {
    return "接收；均分要求待核实，以官网为准"
  }
  let text = "接收"
  if (p.gpaRequired) {
    text += p.gpaRequired.startsWith("≥") ? "，均分要求 " + p.gpaRequired : "，" + p.gpaRequired
  }
  if (p.estimated) {
    text += "（按同类院校一般要求估算）"
  }
  return text
}

/**
 * 现在还能申：截止说明
 *
 * @param {object} p 项目结果
 * @returns {string}
 */
export function deadlineText(p) {
  if (p.unverified) {
    return "截止日待核实，以官网为准"
  }
  if (!p.nextDeadline) {
    return "滚动录取，额满即止，建议尽早递交"
  }
  const when = p.daysLeft === 0 ? "今天截止" : "还剩 " + p.daysLeft + " 天"
  const round = p.nextRound ? p.nextRound + " " : ""
  const more = p.roundsLeft > 1 ? "，之后还有 " + (p.roundsLeft - 1) + " 轮" : ""
  return round + "截止 " + p.nextDeadline + "（" + when + "）" + more + (p.rolling ? "；滚动录取" : "")
}

/**
 * 截止是否紧迫（30 天内）
 *
 * @param {object} p 项目结果
 * @returns {boolean}
 */
export function urgent(p) {
  return !p.unverified && p.daysLeft != null && p.daysLeft <= 30
}
