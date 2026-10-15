import { request } from "./request.js"
import { lastTouch } from "@/utils/channel.js"
import { storage } from "@/utils/storage.js"
import { PLATFORM } from "@/utils/env.js"

// 首屏：各学段的开放情况
export function listDegrees() {
  return request("/app/assessment/degrees").then(res => res.data)
}

// 按学段取启用的问卷
export function getQuestionnaireByDegree(degree) {
  return request("/app/assessment/questionnaire/degree/" + encodeURIComponent(degree)).then(res => res.data)
}

// 同意隐私说明后创建测评（带最近一次进入的渠道码）
export function createAssessment({ requestId, policyVersion, degree }) {
  const touch = lastTouch(storage)
  return request("/app/assessment", {
    method: "POST",
    data: { requestId, policyVersion, degree, channelCode: touch.channelCode || undefined, clientPlatform: PLATFORM }
  }).then(res => res.data)
}
