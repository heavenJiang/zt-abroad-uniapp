/**
 * 渠道码与内容编号：从入口链接（H5 地址参数 / 小程序启动参数）读取，透传给后端
 *
 * 链接参数：ch（或 channel）= 渠道码，ct（或 content）= 内容编号；小程序码用 scene=ch%3Dxhs%26ct%3Dn1；格式与后端一致：字母、数字、_、-，最多 32 位，格式不对忽略。
 * 首次进入的渠道（first touch）只记一次，用于创建访客；最近一次带渠道的进入（last touch）用于创建测评等转化动作。
 */

/** 渠道码 / 内容编号格式（与后端 AbrVisitorServiceImpl.CODE 一致） */
export const CODE = /^[A-Za-z0-9_-]{1,32}$/

const FIRST_KEY = "abr_first_touch"
const LAST_KEY = "abr_last_touch"

function valid(v) {
  return typeof v === "string" && CODE.test(v) ? v : null
}

/**
 * 从启动参数取渠道码与内容编号
 *
 * @param {Record<string, string>} query 地址参数或小程序 query
 * @returns {{channelCode: string|null, contentCode: string|null}}
 */
export function pickCodes(query) {
  const q = { ...parseScene(query && query.scene), ...(query || {}) }
  return {
    channelCode: valid(q.ch) || valid(q.channel),
    contentCode: valid(q.ct) || valid(q.content)
  }
}

/**
 * 小程序码的 scene 参数（最多 32 个字符），约定格式 ch=xhs&ct=n1；微信传入时已做 URL 编码
 *
 * @param {string} scene
 * @returns {Record<string, string>}
 */
export function parseScene(scene) {
  if (typeof scene !== "string" || !scene) {
    return {}
  }
  let text = scene
  try {
    text = decodeURIComponent(scene)
  } catch (e) {
    // 编码异常时按原文解析
  }
  const out = {}
  text.split("&").forEach(pair => {
    const i = pair.indexOf("=")
    if (i > 0) {
      out[pair.slice(0, i)] = pair.slice(i + 1)
    }
  })
  return out
}

/**
 * 记录一次进入：首次进入只记一次；带渠道码的进入覆盖最近一次
 *
 * @param {Record<string, string>} query 启动参数
 * @param {{get: (k: string) => any, set: (k: string, v: any) => void}} store 存储
 * @returns {{channelCode: string|null, contentCode: string|null}} 本次进入的编码
 */
export function recordLaunch(query, store) {
  const codes = pickCodes(query)
  if (!store.get(FIRST_KEY)) {
    store.set(FIRST_KEY, { channelCode: codes.channelCode, contentCode: codes.contentCode })
  }
  if (codes.channelCode) {
    store.set(LAST_KEY, codes)
  }
  return codes
}

/**
 * 首次进入的渠道（创建访客用）
 */
export function firstTouch(store) {
  return store.get(FIRST_KEY) || { channelCode: null, contentCode: null }
}

/**
 * 最近一次带渠道的进入（创建测评等转化动作用；没有时用首次）
 */
export function lastTouch(store) {
  return store.get(LAST_KEY) || firstTouch(store)
}
