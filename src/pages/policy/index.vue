<template>
  <view class="page">
    <view v-if="error" class="hint">{{ error }}</view>
    <template v-else-if="policy">
      <view v-if="policy.draft" class="draft">草案：本隐私政策尚未经律师审阅，仅用于测试</view>
      <view class="meta">{{ policy.title }} · 版本 {{ policy.version }}<text v-if="policy.effectiveDate"> · {{ policy.effectiveDate }} 生效</text></view>
      <policy-text :content="policy.content" />
    </template>
    <view v-else class="hint">加载中…</view>
  </view>
</template>

<script setup>
import { ref } from "vue"
import { onLoad } from "@dcloudio/uni-app"
import PolicyText from "@/components/PolicyText.vue"
import { getPolicy, PRIVACY_POLICY } from "@/api/policy.js"

const policy = ref(null)
const error = ref("")

onLoad(() => {
  getPolicy(PRIVACY_POLICY).then(p => {
    policy.value = p
  }).catch(e => {
    error.value = e.message || "加载失败"
  })
})
</script>

<style lang="scss" scoped>
.page {
  padding: 32rpx;
  background: #ffffff;
  min-height: 100vh;
}
.draft {
  padding: 16rpx 24rpx;
  margin-bottom: 24rpx;
  border-radius: $abr-radius;
  background: #fff4e5;
  color: #b25e09;
  font-size: 24rpx;
}
.meta,
.hint {
  margin-bottom: 24rpx;
  font-size: 24rpx;
  color: $abr-color-text-secondary;
}
</style>
