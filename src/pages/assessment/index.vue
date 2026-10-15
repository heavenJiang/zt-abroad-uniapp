<template>
  <view class="page">
    <view v-if="error" class="hint">{{ error }}</view>
    <template v-else-if="assessment">
      <view class="title">测评已开始</view>
      <view class="desc">进度：第 {{ progress.step }} / {{ progress.total }} 步。你的答案会自动保存，随时可以回来继续。</view>
      <view class="desc">答题页面即将上线，上线后从这里继续。</view>
      <button class="plain" @click="home">返回首页</button>
    </template>
    <view v-else class="hint">加载中…</view>
  </view>
</template>

<script setup>
import { ref } from "vue"
import { onLoad } from "@dcloudio/uni-app"
import { getAssessment, getQuestionnaire } from "@/api/assessment.js"
import { stepOf } from "@/utils/progress.js"

// 测评承接页：问卷答题页在 M4-05 实现，这里先显示进度并保留断点
const assessment = ref(null)
const progress = ref({ step: 1, total: 5 })
const error = ref("")

function home() {
  uni.reLaunch({ url: "/pages/index/index" })
}

onLoad(async options => {
  try {
    assessment.value = await getAssessment(options.id)
    const q = await getQuestionnaire(assessment.value.questionnaireId)
    progress.value = stepOf(q.definition, assessment.value.currentScreen)
  } catch (e) {
    error.value = e.message || "加载失败"
  }
})
</script>

<style lang="scss" scoped>
.page {
  padding: 48rpx 32rpx;
}
.title {
  font-size: 40rpx;
  font-weight: 600;
}
.desc,
.hint {
  margin-top: 20rpx;
  color: $abr-color-text-secondary;
  line-height: 1.6;
}
.plain {
  margin-top: 40rpx;
}
</style>
