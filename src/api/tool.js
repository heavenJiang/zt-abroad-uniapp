import { request } from "./request.js"
import { lastTouch } from "@/utils/channel.js"
import { storage } from "@/utils/storage.js"
import { PLATFORM } from "@/utils/env.js"

// 快测输入页：四题定义与国家 / 地区开放情况
export function getQuickForm(degree) {
  return request("/app/tool/quick/form", { data: { degree } }).then(res => res.data)
}

// 快测计算（带最近一次进入的渠道码与内容编号）
export function runQuick({ answers, policyVersion, degree }) {
  const touch = lastTouch(storage)
  return request("/app/tool/quick", {
    method: "POST",
    data: {
      answers,
      policyVersion,
      degree,
      channelCode: touch.channelCode || undefined,
      contentCode: touch.contentCode || undefined,
      clientPlatform: PLATFORM
    }
  }).then(res => res.data)
}

// 国内高校搜索（至少 2 个字；只返回 ID 与校名）
export function searchUniversity(keyword) {
  return request("/app/cn-university/search", { data: { keyword } }).then(res => res.data || [])
}
