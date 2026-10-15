import { request } from "./request.js"

// 本人的选校单
export function listPlan() {
  return request("/app/plan/items").then(res => res.data || [])
}

// 加入选校单（从快测加入时带 toolRunId，档位由后端按快测记录取得）
export function addPlanItem({ programId, toolRunId }) {
  return request("/app/plan/items", { method: "POST", data: { programId, toolRunId } }).then(res => res.data || [])
}

// 从选校单移除
export function removePlanItem(programId) {
  return request("/app/plan/items/" + programId, { method: "DELETE" }).then(res => res.data || [])
}
