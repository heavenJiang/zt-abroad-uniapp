<template>
  <view class="page">
    <view v-if="loading" class="hint">加载中…</view>
    <view v-else-if="error" class="hint">
      <text>{{ error }}</text>
      <button size="mini" class="retry" @click="load">重试</button>
    </view>
    <template v-else>
      <view v-if="policy.draft" class="draft">草案：本隐私政策尚未经律师审阅，仅用于测试</view>
      <view class="title">{{ consent.title || "开始前，请阅读并同意隐私说明" }}</view>
      <view class="summary">
        <view v-for="(s, i) in consent.summary || []" :key="i" class="item">
          <text class="dot">•</text>
          <text>{{ s }}</text>
        </view>
      </view>
      <view class="toggle" @click="expanded = !expanded">{{ expanded ? "收起完整隐私政策" : "查看完整隐私政策" }}（版本 {{ policy.version }}）</view>
      <view v-if="expanded" class="full">
        <policy-text :content="policy.content" />
      </view>
      <view class="actions">
        <button class="primary" :loading="submitting" :disabled="submitting" @click="agree">同意并开始</button>
        <button class="plain" @click="decline">不同意</button>
        <view class="note">不同意不会保存你的任何信息。</view>
      </view>
    </template>
  </view>
</template>

<script setup>
import { ref } from "vue"
import { onLoad } from "@dcloudio/uni-app"
import PolicyText from "@/components/PolicyText.vue"
import { getQuestionnaireByDegree, createAssessment } from "@/api/assessment.js"
import { getPolicy } from "@/api/policy.js"
import { storage } from "@/utils/storage.js"
import { requestId } from "@/utils/uuid.js"

const degree = ref("master")
const consent = ref({})
const policy = ref({})
const loading = ref(true)
const error = ref("")
const expanded = ref(false)
const submitting = ref(false)

/** 本学段“正在创建”的请求ID：网络重试时复用，避免重复创建测评 */
function pendingKey() {
  return "abr_pending_create_" + degree.value
}

async function load() {
  loading.value = true
  error.value = ""
  try {
    const q = await getQuestionnaireByDegree(degree.value)
    consent.value = (q.definition && q.definition.consent) || {}
    policy.value = await getPolicy(consent.value.policy_code || "abr_privacy_policy")
  } catch (e) {
    error.value = e.message || "加载失败"
  } finally {
    loading.value = false
  }
}

async function agree() {
  submitting.value = true
  let id = storage.get(pendingKey())
  if (!id) {
    id = requestId()
    storage.set(pendingKey(), id)
  }
  try {
    const a = await createAssessment({ requestId: id, policyVersion: policy.value.version, degree: degree.value })
    storage.remove(pendingKey())
    uni.redirectTo({ url: "/pages/assessment/index?id=" + a.assessmentId })
  } catch (e) {
    uni.showToast({ title: e.message || "开始失败，请重试", icon: "none" })
    if (e.message && e.message.includes("隐私政策已更新")) {
      storage.remove(pendingKey())
      load()
    }
  } finally {
    submitting.value = false
  }
}

function decline() {
  uni.navigateBack({ fail: () => uni.reLaunch({ url: "/pages/index/index" }) })
}

onLoad(options => {
  if (options && /^(secondary|bachelor|master|phd)$/.test(options.degree || "")) {
    degree.value = options.degree
  }
  load()
})
</script>

<style lang="scss" scoped>
.page {
  padding: 40rpx 32rpx 64rpx;
}
.draft {
  padding: 16rpx 24rpx;
  margin-bottom: 24rpx;
  border-radius: $abr-radius;
  background: #fff4e5;
  color: #b25e09;
  font-size: 24rpx;
}
.title {
  font-size: 38rpx;
  font-weight: 600;
}
.summary {
  margin-top: 24rpx;
  padding: 24rpx;
  background: #ffffff;
  border-radius: $abr-radius;
}
.item {
  display: flex;
  margin: 12rpx 0;
  line-height: 1.6;
}
.dot {
  margin-right: 12rpx;
  color: $abr-color-primary;
}
.toggle {
  margin-top: 24rpx;
  color: $abr-color-primary;
}
.full {
  margin-top: 16rpx;
  padding: 24rpx;
  max-height: 900rpx;
  overflow-y: auto;
  background: #ffffff;
  border-radius: $abr-radius;
}
.actions {
  margin-top: 40rpx;
}
.primary {
  background: $abr-color-primary;
  color: #ffffff;
  border-radius: 999rpx;
}
.plain {
  margin-top: 20rpx;
  background: transparent;
  color: $abr-color-text-secondary;
}
.note,
.hint {
  margin-top: 16rpx;
  text-align: center;
  font-size: 24rpx;
  color: $abr-color-text-secondary;
}
.retry {
  margin-left: 16rpx;
}
</style>
