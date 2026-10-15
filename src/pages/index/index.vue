<template>
  <view class="page">
    <view class="title">你想申请哪个阶段？</view>
    <view class="subtitle">选择学段后进入对应的测评与工具</view>

    <view v-if="loading" class="hint">加载中…</view>
    <view v-else-if="error" class="hint">
      <text>{{ error }}</text>
      <button class="retry" size="mini" @click="load">重试</button>
    </view>
    <view v-else class="list">
      <view v-for="d in degrees" :key="d.degree" class="card" @click="choose(d)">
        <view class="card-title">{{ d.label }}</view>
        <view class="card-desc">{{ modeText(d) }}</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from "vue"
import { onLoad } from "@dcloudio/uni-app"
import { listDegrees } from "@/api/assessment.js"

const degrees = ref([])
const loading = ref(true)
const error = ref("")

/** 学段开放情况的说明（文本插值显示，不用 v-html） */
function modeText(d) {
  if (d.mode === "assessment") {
    return "可测评，给出冲 / 稳 / 保" + (d.openCountries.length ? "（" + d.openCountries.join("、") + "）" : "")
  }
  if (d.mode === "questionnaire") {
    return "可测评，结果由顾问评估"
  }
  return "由顾问评估"
}

function load() {
  loading.value = true
  error.value = ""
  listDegrees().then(list => {
    degrees.value = list || []
  }).catch(e => {
    error.value = e.message || "加载失败"
  }).finally(() => {
    loading.value = false
  })
}

function choose(d) {
  // 测评与工具页面在 M4 实现；骨架阶段只提示
  uni.showModal({
    title: d.label,
    content: d.mode === "consultant" ? "该学段由顾问评估，预约功能即将上线。" : "测评页面即将上线。",
    showCancel: false
  })
}

onLoad(load)
</script>

<style lang="scss" scoped>
.page {
  padding: 48rpx 32rpx;
}
.title {
  font-size: 44rpx;
  font-weight: 600;
}
.subtitle,
.hint,
.card-desc {
  margin-top: 12rpx;
  color: $abr-color-text-secondary;
}
.list {
  margin-top: 40rpx;
}
.card {
  margin-bottom: 24rpx;
  padding: 32rpx;
  background: #ffffff;
  border-radius: $abr-radius;
}
.card-title {
  font-size: 34rpx;
  font-weight: 600;
}
.retry {
  margin-top: 16rpx;
}
</style>
