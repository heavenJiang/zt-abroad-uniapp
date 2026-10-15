import { request } from "./request.js"

/** 隐私政策编码（与问卷 consent.policy_code 一致） */
export const PRIVACY_POLICY = "abr_privacy_policy"

// 协议当前启用的版本（含全文）
export function getPolicy(code) {
  return request("/app/policy/" + encodeURIComponent(code)).then(res => res.data)
}
