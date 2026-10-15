<template>
  <view class="page">
    <view v-if="!result" class="hint">
      <text>还没有快测结果</text>
      <button size="mini" class="retry" @click="retest">去快测</button>
    </view>
    <template v-else>
      <!-- 必须展示：快测只按院校层次和均分估算 -->
      <view v-for="n in result.notices" :key="n" class="notice">{{ NOTICE_TEXTS[n] || n }}</view>
      <view v-if="result.gpaPercent != null" class="basis">按百分制均分 {{ result.gpaPercent }} 估算</view>

      <view v-if="!result.countries.length" class="card empty">所选国家 / 地区暂未开放快测，可以先做完整测评，由顾问评估。</view>

      <view v-for="c in result.countries" :key="c.country" class="card">
        <view class="country">{{ c.label }}<text class="count">参与计算 {{ c.programCount }} 个项目</text></view>
        <view v-if="!c.programCount" class="muted">院校库中暂无符合你专业方向的项目。</view>

        <view v-for="t in c.tiers" :key="t.tier" class="tier">
          <view class="tier-head">
            <text :class="['tag', t.tier]">{{ TIER_LABELS[t.tier] }}</text>
            <text class="muted">{{ t.count }} 个项目</text>
          </view>
          <view v-if="!t.count" class="muted small">暂无</view>
          <view v-for="p in t.examples" :key="p.programId" class="program">
            <view class="program-main">
              <view class="school">{{ p.schoolName }}</view>
              <view class="name">{{ p.programName }}</view>
              <view v-if="p.requirementUnverified" class="flag">申请要求待核实</view>
            </view>
            <view :class="['add', { done: added.has(p.programId) }]" @click="add(p)">{{ added.has(p.programId) ? "已加入" : "加入选校单" }}</view>
          </view>
        </view>

        <view v-if="c.unratedCount" class="muted small">另有 {{ c.unratedCount }} 个项目待顾问定档</view>

        <!-- 关键差距 -->
        <view v-if="c.keyGaps.length" class="gaps">
          <view class="gaps-title">最关键的差距</view>
          <view v-for="k in c.keyGaps" :key="k.item" class="gap">• {{ keyGapText(k) }}</view>
        </view>

        <!-- 补足后可申 -->
        <view v-if="c.needsImprovementCount" class="tier">
          <view class="tier-head">
            <text class="tag needs_improvement">补足后可申</text>
            <text class="muted">{{ c.needsImprovementCount }} 个项目</text>
          </view>
          <view v-for="p in c.needsImprovement" :key="p.programId" class="program">
            <view class="program-main">
              <view class="school">{{ p.schoolName }}</view>
              <view class="name">{{ p.programName }}</view>
              <view v-for="(g, i) in p.gaps" :key="i" class="flag">{{ gapText(g) }}</view>
            </view>
            <view :class="['add', { done: added.has(p.programId) }]" @click="add(p)">{{ added.has(p.programId) ? "已加入" : "加入选校单" }}</view>
          </view>
        </view>

        <view v-for="h in c.hints" :key="h" class="hint-line">{{ HINT_TEXTS[h] || h }}</view>
      </view>

      <view v-if="result.closedCountries.length" class="muted small closed">
        {{ result.closedCountries.map(c => c.label).join("、") }} 暂未开放快测，完整测评后由顾问评估。
      </view>

      <!-- 引导完整测评 -->
      <view class="card cta">
        <view class="cta-title">想要更准的结果？</view>
        <view class="muted">完整测评会加上语言、科研、实习和偏好，逐项比对项目官网要求；刚才填的信息会自动带入，约 3 分钟。</view>
        <button class="primary" @click="fullAssessment">做完整测评</button>
      </view>

      <view class="links">
        <text class="link" @click="openPlan">我的选校单（{{ added.size }}）</text>
        <text class="link" @click="retest">重新快测</text>
      </view>
      <view class="footer">结果由选校引擎按院校库公开要求计算，仅供参考，不代表录取承诺。</view>
    </template>
  </view>
</template>

<script setup>
import { ref } from "vue"
import { onShow } from "@dcloudio/uni-app"
import { storage } from "@/utils/storage.js"
import { listPlan, addPlanItem } from "@/api/plan.js"
import { TIER_LABELS, NOTICE_TEXTS, HINT_TEXTS, gapText, keyGapText } from "@/utils/quick.js"

const RESULT_KEY = "abr_quick_result"

const result = ref(null)
const added = ref(new Set())
const adding = new Set()

function syncPlan(items) {
  added.value = new Set(items.map(i => i.programId))
}

async function add(p) {
  if (added.value.has(p.programId) || adding.has(p.programId)) {
    return
  }
  adding.add(p.programId)
  try {
    syncPlan(await addPlanItem({ programId: p.programId, toolRunId: result.value.toolRunId }))
    uni.showToast({ title: "已加入选校单", icon: "none" })
  } catch (e) {
    uni.showToast({ title: e.message || "加入失败，请重试", icon: "none" })
  } finally {
    adding.delete(p.programId)
  }
}

function fullAssessment() {
  uni.navigateTo({ url: "/pages/consent/index?degree=master" })
}

function openPlan() {
  uni.navigateTo({ url: "/pages/plan/index" })
}

function retest() {
  uni.redirectTo({ url: "/pages/quick/index" })
}

onShow(() => {
  const r = storage.get(RESULT_KEY)
  result.value = r && Array.isArray(r.countries) ? r : null
  listPlan().then(syncPlan).catch(() => {})
})
</script>

<style lang="scss" scoped>
.page {
  padding: 32rpx 32rpx 64rpx;
}
.notice {
  padding: 16rpx 24rpx;
  margin-bottom: 16rpx;
  border-radius: $abr-radius;
  background: #fff4e5;
  color: #b25e09;
  font-size: 26rpx;
}
.basis,
.muted,
.footer {
  color: $abr-color-text-secondary;
  font-size: 26rpx;
}
.small {
  font-size: 24rpx;
}
.card {
  margin-top: 24rpx;
  padding: 28rpx;
  background: #ffffff;
  border-radius: $abr-radius;
}
.empty {
  color: $abr-color-text-secondary;
}
.country {
  font-size: 36rpx;
  font-weight: 700;
}
.count {
  margin-left: 16rpx;
  font-size: 24rpx;
  font-weight: 400;
  color: $abr-color-text-secondary;
}
.tier {
  margin-top: 24rpx;
}
.tier-head {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 8rpx;
}
.tag {
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  font-weight: 600;
  color: #ffffff;
}
.reach {
  background: #e8590c;
}
.match {
  background: $abr-color-primary;
}
.safety {
  background: #2b8a3e;
}
.needs_improvement {
  background: #868e96;
}
.program {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f1f3;
}
.program-main {
  flex: 1;
  min-width: 0;
}
.school {
  font-weight: 600;
}
.name {
  font-size: 26rpx;
}
.flag {
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #b25e09;
}
.add {
  flex: none;
  margin-left: 16rpx;
  padding: 8rpx 20rpx;
  border-radius: 999rpx;
  border: 2rpx solid $abr-color-primary;
  color: $abr-color-primary;
  font-size: 24rpx;
}
.add.done {
  border-color: #c9cdd4;
  color: $abr-color-text-secondary;
}
.gaps {
  margin-top: 24rpx;
  padding: 20rpx;
  border-radius: $abr-radius;
  background: #f7f8fa;
}
.gaps-title {
  font-weight: 600;
  margin-bottom: 8rpx;
}
.gap,
.hint-line {
  margin-top: 8rpx;
  font-size: 26rpx;
  line-height: 1.5;
}
.hint-line {
  color: #b25e09;
}
.closed {
  margin-top: 24rpx;
}
.cta-title {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}
.primary {
  margin-top: 24rpx;
  background: $abr-color-primary;
  color: #ffffff;
  border-radius: 999rpx;
}
.links {
  display: flex;
  justify-content: center;
  gap: 48rpx;
  margin-top: 32rpx;
}
.link {
  color: $abr-color-primary;
}
.footer {
  margin-top: 32rpx;
  text-align: center;
  font-size: 22rpx;
}
.hint {
  text-align: center;
  color: $abr-color-text-secondary;
}
.retry {
  margin-left: 16rpx;
}
</style>
