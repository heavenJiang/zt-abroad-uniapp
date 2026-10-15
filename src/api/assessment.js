import { request } from "./request.js"
import { lastTouch } from "@/utils/channel.js"
import { storage } from "@/utils/storage.js"
import { PLATFORM } from "@/utils/env.js"

// 首屏：各学段的开放情况
export function listDegrees() {
  return request("/app/assessment/degrees").then(res => res.data)
}

// 落地页：已完成测评的人数（人数少时为 null，不显示）
export function getStats() {
  return request("/app/assessment/stats").then(res => ({ submittedCount: res.submittedCount ?? null }))
}

// 按学段取启用的问卷
export function getQuestionnaireByDegree(degree) {
  return request("/app/assessment/questionnaire/degree/" + encodeURIComponent(degree)).then(res => res.data)
}

// 按版本取问卷（续答）
export function getQuestionnaire(questionnaireId) {
  return request("/app/assessment/questionnaire/" + questionnaireId).then(res => res.data)
}

// 本人最近一次答题中的测评（没有为 null）
export function getCurrentAssessment(code) {
  return request("/app/assessment/current", { data: { code } }).then(res => res.data || null)
}

// 取本人的测评
export function getAssessment(assessmentId) {
  return request("/app/assessment/" + assessmentId).then(res => res.data)
}

// 同意隐私说明后创建测评（带最近一次进入的渠道码与内容编号）
export function createAssessment({ requestId, policyVersion, degree }) {
  const touch = lastTouch(storage)
  return request("/app/assessment", {
    method: "POST",
    data: {
      requestId,
      policyVersion,
      degree,
      channelCode: touch.channelCode || undefined,
      contentCode: touch.contentCode || undefined,
      clientPlatform: PLATFORM
    }
  }).then(res => res.data)
}
