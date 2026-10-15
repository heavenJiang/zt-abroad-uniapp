/**
 * C 端请求客户端（与 uni 运行时解耦，便于单元测试）
 *
 * - 只允许请求后端 /app/**（管理端接口一律拒绝，防止误调）；
 * - 匿名访客令牌：首次请求前调用 POST /app/visitor 取得，存本地，之后放在请求头 X-Visitor-Token；
 * - 后端返回 code 401（访客身份失效）时清除本地令牌、重新取得后重试一次；
 * - 后端统一响应 {code, msg, data}：code 200 视为成功，其余抛出 Error(msg)。
 */
import { firstTouch } from "./channel.js"

export const VISITOR_HEADER = "X-Visitor-Token"
export const TOKEN_KEY = "abr_visitor_token"
const APP_PREFIX = "/app/"

/**
 * @param {object} deps
 * @param {(opts: {url: string, method: string, data?: any, header: object}) => Promise<{statusCode: number, data: any}>} deps.transport 发请求
 * @param {{get: (k: string) => any, set: (k: string, v: any) => void, remove: (k: string) => void}} deps.store 本地存储
 * @param {string} deps.baseUrl 后端地址（H5 同源时为空串）
 * @param {string} deps.platform 端：h5 / mp_weixin
 */
export function createClient({ transport, store, baseUrl, platform }) {
  let entering = null

  async function send(url, method, data, header) {
    if (typeof url !== "string" || !url.startsWith(APP_PREFIX)) {
      throw new Error("C 端只能请求 /app/** 接口：" + url)
    }
    const res = await transport({ url: (baseUrl || "") + url, method, data, header })
    if (res.statusCode !== 200) {
      throw Object.assign(new Error("网络异常，请稍后重试（" + res.statusCode + "）"), { status: res.statusCode })
    }
    return res.data || {}
  }

  /** 取得访客令牌（并发调用共用同一次请求） */
  function ensureVisitor() {
    const token = store.get(TOKEN_KEY)
    if (token) {
      return Promise.resolve(token)
    }
    if (!entering) {
      const touch = firstTouch(store)
      entering = send("/app/visitor", "POST", {
        channelCode: touch.channelCode || undefined,
        contentCode: touch.contentCode || undefined,
        clientPlatform: platform
      }, {}).then(body => {
        if (body.code !== 200 || !body.visitorToken) {
          throw new Error(body.msg || "进入失败，请刷新后重试")
        }
        store.set(TOKEN_KEY, body.visitorToken)
        return body.visitorToken
      }).finally(() => {
        entering = null
      })
    }
    return entering
  }

  /**
   * 请求 /app/** 接口
   *
   * @param {string} url 以 /app/ 开头
   * @param {object} [options]
   * @param {string} [options.method] GET / POST / PUT / DELETE
   * @param {any} [options.data] 请求体或查询参数
   * @returns {Promise<object>} 后端响应体（code 为 200）
   */
  async function request(url, { method = "GET", data } = {}) {
    for (let attempt = 0; ; attempt++) {
      const token = await ensureVisitor()
      const body = await send(url, method, data, { [VISITOR_HEADER]: token })
      if (body.code === 200) {
        return body
      }
      if (body.code === 401 && attempt === 0) {
        // 访客身份失效（如后台清理）：换一个新身份重试一次
        store.remove(TOKEN_KEY)
        continue
      }
      throw Object.assign(new Error(body.msg || "操作失败"), { code: body.code })
    }
  }

  return { request, ensureVisitor }
}
