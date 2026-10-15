<template>
  <view class="page">
    <view class="title">我的选校单</view>
    <view class="muted">未登录也会保存在本机访客身份下；微信登录上线后可同步到账号。</view>
    <view v-if="loading" class="hint">加载中…</view>
    <view v-else-if="error" class="hint">
      <text>{{ error }}</text>
      <button size="mini" class="retry" @click="load">重试</button>
    </view>
    <view v-else-if="!items.length" class="card empty">
      <view>选校单还是空的</view>
      <button class="primary" @click="quick">去做 30 秒快测</button>
    </view>
    <template v-else>
      <view v-for="g in groups" :key="g.key" class="card">
        <view class="group-head">
          <text :class="['tag', g.key]">{{ g.label }}</text>
          <text class="muted">{{ g.items.length }} 个</text>
        </view>
        <view v-for="i in g.items" :key="i.programId" class="program">
          <view class="program-main">
            <view class="school">{{ i.schoolName }}</view>
            <view class="name">{{ i.programName }}</view>
            <view class="muted small">{{ i.countryLabel }}</view>
          </view>
          <view class="remove" @click="remove(i)">移除</view>
        </view>
      </view>
      <view class="muted small note">档位为加入时快测的结果；完整测评后会按你的完整背景更新。</view>
    </template>
  </view>
</template>

<script setup>
import { computed, ref } from "vue"
import { onShow } from "@dcloudio/uni-app"
import { listPlan, removePlanItem } from "@/api/plan.js"
import { TIER_LABELS } from "@/utils/quick.js"

/** 分组顺序：冲 → 稳 → 保 → 待定档 → 补足后可申 → 未定档 */
const ORDER = ["reach", "match", "safety", "unrated", "needs_improvement", "none"]

const items = ref([])
const loading = ref(true)
const error = ref("")

const groups = computed(() => ORDER.map(key => ({
  key,
  label: TIER_LABELS[key] || "未定档",
  items: items.value.filter(i => (i.tier || "none") === key)
})).filter(g => g.items.length))

async function load() {
  loading.value = true
  error.value = ""
  try {
    items.value = await listPlan()
  } catch (e) {
    error.value = e.message || "加载失败"
  } finally {
    loading.value = false
  }
}

function remove(item) {
  uni.showModal({
    title: "移除",
    content: "从选校单移除 " + item.schoolName + "？",
    success: async res => {
      if (!res.confirm) {
        return
      }
      try {
        items.value = await removePlanItem(item.programId)
      } catch (e) {
        uni.showToast({ title: e.message || "移除失败", icon: "none" })
      }
    }
  })
}

function quick() {
  uni.navigateTo({ url: "/pages/quick/index" })
}

onShow(load)
</script>

<style lang="scss" scoped>
.page {
  padding: 40rpx 32rpx 64rpx;
}
.title {
  font-size: 44rpx;
  font-weight: 700;
}
.muted,
.hint {
  margin-top: 8rpx;
  color: $abr-color-text-secondary;
  font-size: 26rpx;
}
.small {
  font-size: 24rpx;
}
.hint {
  text-align: center;
}
.card {
  margin-top: 24rpx;
  padding: 28rpx;
  background: #ffffff;
  border-radius: $abr-radius;
}
.empty {
  text-align: center;
  color: $abr-color-text-secondary;
}
.group-head {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.tag {
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  font-weight: 600;
  color: #ffffff;
  background: #adb5bd;
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
.needs_improvement,
.unrated {
  background: #868e96;
}
.program {
  display: flex;
  align-items: center;
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
.remove {
  flex: none;
  margin-left: 16rpx;
  color: $abr-color-text-secondary;
  font-size: 24rpx;
}
.note {
  margin-top: 24rpx;
  text-align: center;
}
.primary {
  margin-top: 24rpx;
  background: $abr-color-primary;
  color: #ffffff;
  border-radius: 999rpx;
}
.retry {
  margin-left: 16rpx;
}
</style>
