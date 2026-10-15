/**
 * 结果页“加入选校单”：已加入的项目、加入（带工具运行ID，档位由后端取得）
 */
import { ref } from "vue"
import { listPlan, addPlanItem } from "@/api/plan.js"

export function usePlan() {
  const added = ref(new Set())
  const adding = new Set()

  function sync(items) {
    added.value = new Set(items.map(i => i.programId))
  }

  function refresh() {
    return listPlan().then(sync).catch(() => {})
  }

  async function add(programId, toolRunId) {
    if (added.value.has(programId) || adding.has(programId)) {
      return
    }
    adding.add(programId)
    try {
      sync(await addPlanItem({ programId, toolRunId }))
      uni.showToast({ title: "已加入选校单", icon: "none" })
    } catch (e) {
      uni.showToast({ title: e.message || "加入失败，请重试", icon: "none" })
    } finally {
      adding.delete(programId)
    }
  }

  return { added, add, refresh }
}
