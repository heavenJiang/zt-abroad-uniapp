/**
 * 运行环境：端与后端地址（构建时确定）
 */

/** 后端约定的端编码：h5 / mp_weixin */
export const PLATFORM = process.env.UNI_PLATFORM === "mp-weixin" ? "mp_weixin" : "h5"

/** 后端地址：H5 同源（Nginx 只代理 /app/**），小程序为配置的合法域名 */
export const BASE_URL = PLATFORM === "mp_weixin" ? (import.meta.env.VITE_MP_API_BASE || "") : (import.meta.env.VITE_API_BASE || "")
