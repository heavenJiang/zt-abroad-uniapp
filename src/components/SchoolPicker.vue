<template>
  <view>
    <view v-if="modelValue" class="picked">
      <text>{{ text }}</text>
      <text class="link" @click="clear">修改</text>
    </view>
    <template v-else>
      <input class="input" :value="keyword" placeholder="输入校名或简称，如“北航”" @input="onKeyword" />
      <view v-if="searching" class="tip">搜索中…</view>
      <view v-for="u in results" :key="u.universityId" class="option" @click="pick(u)">{{ u.name }}</view>
      <view v-if="keyword.length >= 2 && !searching && !results.length" class="tip">没有找到，可以选下面的选项</view>
      <view class="specials">
        <view class="link" @click="special('overseas')">我在海外读本科</view>
        <view class="link" @click="special('not_found')">搜不到我的学校</view>
      </view>
    </template>
  </view>
</template>

<script setup>
// 本科学校选择：按校名或简称搜索国内高校（只返回校名，不显示院校层次），或选择海外本科 / 搜不到
import { computed, ref } from "vue"
import { searchUniversity } from "@/api/tool.js"

const props = defineProps({ modelValue: { type: Object, default: null } })
const emit = defineEmits(["update:modelValue"])

const keyword = ref("")
const results = ref([])
const searching = ref(false)
let timer = null
let seq = 0

const text = computed(() => {
  const s = props.modelValue
  if (!s) {
    return ""
  }
  if (s.kind === "overseas") {
    return "海外本科"
  }
  if (s.kind === "not_found") {
    return s.name ? s.name + "（未收录）" : "搜不到我的学校"
  }
  return s.name
})

function onKeyword(e) {
  keyword.value = e.detail.value.trim()
  clearTimeout(timer)
  results.value = []
  if (keyword.value.length < 2) {
    return
  }
  timer = setTimeout(async () => {
    const mine = ++seq
    searching.value = true
    try {
      const list = await searchUniversity(keyword.value)
      if (mine === seq) {
        results.value = list
      }
    } catch (err) {
      if (mine === seq) {
        results.value = []
      }
    } finally {
      if (mine === seq) {
        searching.value = false
      }
    }
  }, 300)
}

function pick(u) {
  emit("update:modelValue", { kind: "cn", university_id: u.universityId, name: u.name })
}

function special(kind) {
  emit("update:modelValue", { kind, university_id: null, name: kind === "not_found" ? keyword.value : "" })
}

function clear() {
  results.value = []
  emit("update:modelValue", null)
}
</script>

<style lang="scss" scoped>
.input {
  height: 80rpx;
  padding: 0 24rpx;
  border-radius: $abr-radius;
  background: #f2f3f5;
}
.tip {
  margin-top: 12rpx;
  color: $abr-color-text-secondary;
  font-size: 26rpx;
}
.option {
  padding: 20rpx 8rpx;
  border-bottom: 1rpx solid #f0f1f3;
}
.picked {
  display: flex;
  justify-content: space-between;
}
.link {
  color: $abr-color-primary;
}
.specials {
  display: flex;
  gap: 32rpx;
  margin-top: 16rpx;
  font-size: 26rpx;
}
</style>
