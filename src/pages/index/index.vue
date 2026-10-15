<template>
  <view class="page">
    <!-- 品牌与一句话价值 -->
    <view class="hero">
      <view class="brand">{{ LANDING.brand }}</view>
      <view class="headline">{{ LANDING.headline }}</view>
      <view class="audience">{{ LANDING.audience }}</view>
      <view v-if="submittedCount" class="count">已有 {{ submittedCount }} 人完成测评</view>
    </view>

    <!-- 学段选择（首屏学段路由） -->
    <view class="section">
      <view class="section-title">你要申请的阶段</view>
      <view v-if="degreesError" class="hint">
        <text>{{ degreesError }}</text>
        <button size="mini" class="retry" @click="loadDegrees">重试</button>
      </view>
      <view v-else class="chips">
        <view v-for="d in degrees" :key="d.degree" :class="['chip', { active: d.degree === degree }]" @click="selectDegree(d.degree)">
          {{ d.label }}
        </view>
      </view>
      <view v-if="current" class="mode">{{ modeText(current) }}</view>
    </view>

    <!-- 入口工具：不想答完整问卷时先快测 -->
    <view v-if="current && current.method === 'tiered'" class="section">
      <view v-for="t in LANDING.tools" :key="t.url" class="tool" @click="openTool(t)">
        <view>
          <view class="benefit-title">{{ t.title }}</view>
          <view class="benefit-desc">{{ t.desc }}</view>
        </view>
        <text class="arrow">›</text>
      </view>
      <view class="link plan-link" @click="openPlan">我的选校单</view>
    </view>

    <!-- 测完你会得到 -->
    <view class="section">
      <view class="section-title">测完你会得到</view>
      <view v-for="b in LANDING.benefits" :key="b.title" class="benefit">
        <view class="benefit-title">{{ b.title }}</view>
        <view class="benefit-desc">{{ b.desc }}</view>
      </view>
      <!-- 示例报告：模糊处理，不含真实学生数据 -->
      <view class="sample">
        <view class="sample-tag">示例</view>
        <view class="sample-body">
          <view class="sample-row"><text class="t reach">冲</text><text class="bar w60" /></view>
          <view class="sample-row"><text class="t match">稳</text><text class="bar w80" /></view>
          <view class="sample-row"><text class="t safety">保</text><text class="bar w70" /></view>
        </view>
      </view>
    </view>

    <!-- 三步流程 -->
    <view class="section">
      <view class="section-title">三步完成</view>
      <view v-for="(s, i) in LANDING.steps" :key="s" class="step">
        <text class="step-no">{{ i + 1 }}</text>
        <text>{{ s }}</text>
      </view>
    </view>

    <!-- 主按钮 -->
    <view class="cta">
      <button v-if="resume" class="primary" @click="continueAssessment">继续上次测评（第 {{ resume.step }} / {{ resume.total }} 步）</button>
      <button v-else-if="current && current.mode === 'consultant'" class="primary" @click="consultant">该阶段由顾问评估</button>
      <button v-else class="primary" :disabled="!current" @click="start">开始免费测评</button>
      <view v-if="resume" class="restart" @click="start">重新开始</view>
    </view>

    <view class="footer">
      <view>{{ LANDING.disclaimer }}</view>
      <view class="link" @click="openPolicy">隐私政策</view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue"
import { onShow } from "@dcloudio/uni-app"
import { LANDING } from "@/config/landing.js"
import { listDegrees, getStats, getQuestionnaireByDegree, getCurrentAssessment, getQuestionnaire } from "@/api/assessment.js"
import { storage } from "@/utils/storage.js"
import { stepOf } from "@/utils/progress.js"

const DEGREE_KEY = "abr_degree"

const degrees = ref([])
const degreesError = ref("")
const degree = ref(storage.get(DEGREE_KEY) || "master")
const submittedCount = ref(null)
const resume = ref(null)

const current = computed(() => degrees.value.find(d => d.degree === degree.value) || null)

/** 学段开放情况说明 */
function modeText(d) {
  if (d.mode === "assessment") {
    return "可测评，直接给出冲 / 稳 / 保" + (d.openCountries.length ? "（已开放：" + d.openCountries.join("、") + "）" : "")
  }
  if (d.mode === "questionnaire") {
    return "可测评，选校结果由顾问评估后给你"
  }
  return "该阶段暂由顾问评估，测评即将开放"
}

function loadDegrees() {
  degreesError.value = ""
  return listDegrees().then(list => {
    degrees.value = list || []
    if (!current.value && degrees.value.length) {
      degree.value = "master"
    }
  }).catch(e => {
    degreesError.value = e.message || "加载失败"
  })
}

/** 有未完成的测评时，主按钮改为“继续上次测评” */
async function loadResume() {
  resume.value = null
  if (!current.value || current.value.mode === "consultant") {
    return
  }
  try {
    const q = await getQuestionnaireByDegree(degree.value)
    const a = await getCurrentAssessment(q.code)
    if (a && a.status === "in_progress") {
      const def = a.questionnaireId === q.questionnaireId ? q.definition : (await getQuestionnaire(a.questionnaireId)).definition
      resume.value = { assessmentId: a.assessmentId, ...stepOf(def, a.currentScreen) }
    }
  } catch (e) {
    // 取不到续答信息时照常显示“开始免费测评”
  }
}

function selectDegree(value) {
  degree.value = value
  storage.set(DEGREE_KEY, value)
  loadResume()
}

function start() {
  uni.navigateTo({ url: "/pages/consent/index?degree=" + degree.value })
}

function continueAssessment() {
  uni.navigateTo({ url: "/pages/assessment/index?id=" + resume.value.assessmentId })
}

function consultant() {
  uni.showModal({ title: "顾问评估", content: "该阶段的选校由顾问评估，预约功能即将上线。", showCancel: false })
}

function openTool(t) {
  uni.navigateTo({ url: t.url + "?degree=" + degree.value })
}

function openPlan() {
  uni.navigateTo({ url: "/pages/plan/index" })
}

function openPolicy() {
  uni.navigateTo({ url: "/pages/policy/index" })
}

onShow(async () => {
  getStats().then(s => {
    submittedCount.value = s.submittedCount
  }).catch(() => {})
  await loadDegrees()
  loadResume()
})
</script>

<style lang="scss" scoped>
.page {
  padding: 40rpx 32rpx 64rpx;
}
.hero {
  padding: 24rpx 0 16rpx;
}
.brand {
  font-size: 26rpx;
  color: $abr-color-primary;
  font-weight: 600;
}
.headline {
  margin-top: 16rpx;
  font-size: 48rpx;
  font-weight: 700;
  line-height: 1.3;
}
.audience,
.count,
.mode,
.benefit-desc,
.hint {
  margin-top: 12rpx;
  color: $abr-color-text-secondary;
}
.section {
  margin-top: 32rpx;
  padding: 28rpx;
  background: #ffffff;
  border-radius: $abr-radius;
}
.section-title {
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.chip {
  padding: 12rpx 32rpx;
  border-radius: 999rpx;
  background: #f2f3f5;
}
.chip.active {
  background: $abr-color-primary;
  color: #ffffff;
}
.benefit {
  margin-bottom: 20rpx;
}
.benefit-title {
  font-weight: 600;
}
.sample {
  position: relative;
  margin-top: 16rpx;
  padding: 24rpx;
  border-radius: $abr-radius;
  background: #f7f8fa;
}
.sample-tag {
  position: absolute;
  right: 16rpx;
  top: 12rpx;
  font-size: 22rpx;
  color: $abr-color-text-secondary;
}
.sample-body {
  filter: blur(3px);
}
.sample-row {
  display: flex;
  align-items: center;
  margin: 12rpx 0;
}
.t {
  width: 56rpx;
  font-weight: 600;
}
.reach {
  color: #e8590c;
}
.match {
  color: $abr-color-primary;
}
.safety {
  color: #2b8a3e;
}
.bar {
  display: inline-block;
  height: 20rpx;
  border-radius: 10rpx;
  background: #c9cdd4;
}
.w60 {
  width: 60%;
}
.w70 {
  width: 70%;
}
.w80 {
  width: 80%;
}
.step {
  margin: 12rpx 0;
}
.step-no {
  display: inline-block;
  width: 40rpx;
  height: 40rpx;
  margin-right: 16rpx;
  line-height: 40rpx;
  text-align: center;
  border-radius: 50%;
  background: $abr-color-primary;
  color: #ffffff;
  font-size: 24rpx;
}
.cta {
  margin-top: 40rpx;
}
.primary {
  background: $abr-color-primary;
  color: #ffffff;
  border-radius: 999rpx;
}
.restart {
  margin-top: 20rpx;
  text-align: center;
  color: $abr-color-text-secondary;
}
.footer {
  margin-top: 40rpx;
  font-size: 22rpx;
  color: $abr-color-text-secondary;
  text-align: center;
}
.link {
  margin-top: 8rpx;
  color: $abr-color-primary;
}
.retry {
  margin-left: 16rpx;
}
.tool {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.tool + .tool {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f1f3;
}
.arrow {
  font-size: 44rpx;
  color: $abr-color-text-secondary;
}
.plan-link {
  margin-top: 20rpx;
  font-size: 26rpx;
}
</style>
