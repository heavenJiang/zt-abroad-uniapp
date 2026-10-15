<template>
  <view class="page">
    <view class="title">现在还能申</view>
    <view class="muted">按截止日从近到远，列出本申请季仍开放的项目</view>
    <view v-if="error" class="hint">
      <text>{{ error }}</text>
      <button size="mini" class="retry" @click="load">重试</button>
    </view>
    <template v-else-if="def">
      <view class="card">
        <view class="q">国家 / 地区（可多选）</view>
        <view class="chips">
          <view v-for="c in def.countries" :key="c.value" :class="['chip', { active: form.countries.includes(c.value) }]" @click="toggle(c.value)">
            {{ c.label }}
          </view>
        </view>
      </view>
      <view class="card">
        <view class="q">专业方向（选填）</view>
        <picker :range="fieldOptions" range-key="label" :value="fieldIndex" @change="e => (form.field = fieldOptions[e.detail.value].value)">
          <view class="input picker">{{ fieldLabel }}</view>
        </picker>
      </view>
      <button class="primary" :loading="submitting" :disabled="submitting" @click="submit">查看仍开放的项目</button>

      <template v-if="result">
        <view class="muted">截至 {{ result.today }}，共 {{ result.programs.length }} 个项目仍开放<text v-if="result.closedCount">，{{ result.closedCount }} 个本季已截止</text></view>
        <view v-if="!result.programs.length" class="card muted">没有找到仍开放的项目。</view>
        <view v-else class="card">
          <view v-for="p in result.programs" :key="p.programId" class="program">
            <view class="program-main">
              <view class="school">{{ p.schoolName }}<text class="country-tag">{{ p.countryLabel }}</text></view>
              <view class="name">{{ p.programName }}</view>
              <view :class="['line', { urgent: urgent(p) }]">{{ deadlineText(p) }}</view>
            </view>
            <view :class="['add', { done: added.has(p.programId) }]" @click="add(p.programId, result.toolRunId)">
              {{ added.has(p.programId) ? "已加入" : "加入选校单" }}
            </view>
          </view>
        </view>
        <view v-if="result.missingCount" class="muted small">另有 {{ result.missingCount }} 个项目院校库暂未录入截止日。</view>
        <view class="footer">截止日来自院校库，仅供参考，递交前请以项目官网为准。</view>
      </template>
    </template>
    <view v-else class="hint">加载中…</view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from "vue"
import { onLoad, onShow } from "@dcloudio/uni-app"
import { getToolForm, runTool } from "@/api/tool.js"
import { storage } from "@/utils/storage.js"
import { deadlineText, urgent } from "@/utils/tools.js"
import { usePlan } from "@/utils/usePlan.js"

// 不采集个人信息（只选国家与专业），不需要同意隐私政策
const LAST_KEY = "abr_tool_open_last"

const def = ref(null)
const error = ref("")
const submitting = ref(false)
const result = ref(null)
const form = reactive({ countries: [], field: "", ...(storage.get(LAST_KEY) || {}) })
const { added, add, refresh } = usePlan()

const fieldOptions = computed(() => {
  const q = def.value && def.value.questions.find(x => x.id === "target_field")
  return [{ value: "", label: "不限" }, ...((q && q.options) || []).filter(o => o.value !== "undecided")]
})
const fieldIndex = computed(() => Math.max(0, fieldOptions.value.findIndex(o => o.value === form.field)))
const fieldLabel = computed(() => fieldOptions.value[fieldIndex.value].label)

function toggle(value) {
  const i = form.countries.indexOf(value)
  if (i >= 0) {
    form.countries.splice(i, 1)
  } else {
    form.countries.push(value)
  }
}

async function load() {
  error.value = ""
  try {
    def.value = await getToolForm("open", "master")
  } catch (e) {
    error.value = e.message || "加载失败"
  }
}

async function submit() {
  if (!form.countries.length) {
    uni.showToast({ title: "请选择国家 / 地区", icon: "none" })
    return
  }
  submitting.value = true
  try {
    result.value = await runTool("open", { answers: { target_countries: [...form.countries], target_field: form.field || null }, degree: "master" })
    storage.set(LAST_KEY, { countries: [...form.countries], field: form.field })
  } catch (e) {
    uni.showToast({ title: e.message || "查询失败，请重试", icon: "none" })
  } finally {
    submitting.value = false
  }
}

onLoad(load)
onShow(refresh)
</script>

<style lang="scss" scoped>
@import "./tool.scss";
.picker {
  display: flex;
  align-items: center;
}
.country-tag {
  margin-left: 12rpx;
  font-size: 22rpx;
  font-weight: 400;
  color: $abr-color-text-secondary;
}
.line.urgent {
  color: #e8590c;
}
</style>
