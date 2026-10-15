<template>
  <view class="consent" @click="emit('update:modelValue', !modelValue)">
    <view :class="['box', { on: modelValue }]">{{ modelValue ? "✓" : "" }}</view>
    <view class="text">
      <text>我已阅读并同意</text>
      <text class="link" @click.stop="openPolicy">《隐私政策》</text>
      <text>（版本 {{ policy.version || "—" }}）。{{ note }}</text>
      <text v-if="policy.draft" class="draft">草案，尚未经律师审阅，仅用于测试</text>
    </view>
  </view>
</template>

<script setup>
// 入口工具的隐私同意勾选（默认不勾选）；本机已同意过当前版本时自动勾选，后端仍按版本校验
import { onMounted, ref } from "vue"
import { getPolicy, PRIVACY_POLICY } from "@/api/policy.js"
import { storage } from "@/utils/storage.js"
import { CONSENT_KEY } from "@/utils/quick.js"

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  policyCode: { type: String, default: PRIVACY_POLICY },
  note: { type: String, default: "只用于计算结果，不需要姓名和手机号。" }
})
const emit = defineEmits(["update:modelValue", "policy"])
const policy = ref({})

function openPolicy() {
  uni.navigateTo({ url: "/pages/policy/index" })
}

onMounted(async () => {
  try {
    policy.value = await getPolicy(props.policyCode || PRIVACY_POLICY)
    emit("policy", policy.value)
    if (storage.get(CONSENT_KEY) === policy.value.version) {
      emit("update:modelValue", true)
    }
  } catch (e) {
    // 取不到协议时不勾选，提交时后端会提示
  }
})
</script>

<style lang="scss" scoped>
.consent {
  display: flex;
  margin-top: 32rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: $abr-color-text-secondary;
}
.box {
  flex: none;
  width: 32rpx;
  height: 32rpx;
  margin: 4rpx 16rpx 0 0;
  border: 2rpx solid #c9cdd4;
  border-radius: 6rpx;
  text-align: center;
  line-height: 32rpx;
  font-size: 22rpx;
}
.box.on {
  background: $abr-color-primary;
  border-color: $abr-color-primary;
  color: #ffffff;
}
.link {
  color: $abr-color-primary;
}
.draft {
  display: block;
  color: #b25e09;
}
</style>
