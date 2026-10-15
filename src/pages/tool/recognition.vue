<template>
  <view class="page">
    <view class="title">本校认可度</view>
    <view class="muted">选你的本科学校，看各国家 / 地区的项目是否接收、均分要求多少</view>
    <view v-if="error" class="hint">
      <text>{{ error }}</text>
      <button size="mini" class="retry" @click="load">重试</button>
    </view>
    <template v-else-if="def">
      <view class="card">
        <view class="q">本科学校</view>
        <school-picker v-model="school" />
      </view>
      <consent-check v-model="agreed" :policy-code="def.policyCode" @policy="p => (policy = p)" />
      <button class="primary" :loading="submitting" :disabled="submitting" @click="submit">查看认可情况</button>

      <template v-if="result">
        <view v-for="n in result.notices" :key="n" class="notice">{{ NOTICE_TEXTS[n] || n }}</view>
        <view v-if="!result.countries.length" class="card muted">暂未开放任何国家 / 地区。</view>
        <view v-for="c in result.countries" :key="c.country" class="card">
          <view class="country">{{ c.label }}</view>
          <view class="muted">接收 {{ c.acceptedCount }} 个项目 · 不接收 {{ c.notAcceptedCount }} 个</view>
          <view v-if="!c.programs.length" class="muted small">院校库暂无该国家 / 地区的项目</view>
          <view v-for="p in c.programs" :key="p.programId" class="program">
            <view class="program-main">
              <view class="school">{{ p.schoolName }}</view>
              <view class="name">{{ p.programName }}</view>
              <view :class="['line', p.status]">{{ recognitionText(p) }}</view>
            </view>
            <view v-if="p.status === 'accepted'" :class="['add', { done: added.has(p.programId) }]" @click="add(p.programId, result.toolRunId)">
              {{ added.has(p.programId) ? "已加入" : "加入选校单" }}
            </view>
          </view>
        </view>
        <view v-if="result.closedCountries.length" class="muted small">
          {{ result.closedCountries.map(c => c.label).join("、") }} 暂未开放。
        </view>
        <view class="footer">数据来自院校库公开要求，仅供参考，以项目官网为准。</view>
      </template>
    </template>
    <view v-else class="hint">加载中…</view>
  </view>
</template>

<script setup>
import { ref } from "vue"
import { onLoad, onShow } from "@dcloudio/uni-app"
import SchoolPicker from "@/components/SchoolPicker.vue"
import ConsentCheck from "@/components/ConsentCheck.vue"
import { getToolForm, runTool } from "@/api/tool.js"
import { storage } from "@/utils/storage.js"
import { CONSENT_KEY, NOTICE_TEXTS } from "@/utils/quick.js"
import { recognitionText } from "@/utils/tools.js"
import { usePlan } from "@/utils/usePlan.js"

const SCHOOL_KEY = "abr_tool_school"

const def = ref(null)
const error = ref("")
const school = ref(storage.get(SCHOOL_KEY))
const agreed = ref(false)
const policy = ref({})
const submitting = ref(false)
const result = ref(null)
const { added, add, refresh } = usePlan()

async function load() {
  error.value = ""
  try {
    def.value = await getToolForm("recognition", "master")
  } catch (e) {
    error.value = e.message || "加载失败"
  }
}

async function submit() {
  if (!school.value) {
    uni.showToast({ title: "请选择本科学校", icon: "none" })
    return
  }
  if (!agreed.value) {
    uni.showToast({ title: "请先阅读并同意隐私政策", icon: "none" })
    return
  }
  submitting.value = true
  try {
    result.value = await runTool("recognition", { answers: { undergrad_school: school.value }, policyVersion: policy.value.version, degree: "master" })
    storage.set(SCHOOL_KEY, school.value)
    storage.set(CONSENT_KEY, policy.value.version)
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
.line.not_accepted {
  color: #c92a2a;
}
</style>
