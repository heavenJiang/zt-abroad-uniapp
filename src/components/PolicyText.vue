<template>
  <!-- 协议全文：按块用文本插值显示，不使用 v-html -->
  <view class="policy">
    <view v-for="(b, i) in blocks" :key="i" :class="['blk', 'blk-' + b.type]">
      <view v-if="b.type === 'hr'" class="hr" />
      <view v-else-if="b.type === 'row'" class="row">
        <text v-for="(c, j) in b.cells" :key="j" class="cell">{{ c }}</text>
      </view>
      <template v-else>
        <text v-if="b.type === 'li'" class="dot">• </text>
        <text v-for="(s, j) in b.spans" :key="j" :class="{ b: s.bold }">{{ s.text }}</text>
      </template>
    </view>
  </view>
</template>

<script setup>
import { computed } from "vue"
import { parseMarkdown } from "@/utils/markdown.js"

const props = defineProps({
  content: { type: String, default: "" }
})

const blocks = computed(() => parseMarkdown(props.content))
</script>

<style lang="scss" scoped>
.policy {
  font-size: 26rpx;
  line-height: 1.75;
  color: #1f2329;
}
.blk {
  margin-bottom: 12rpx;
}
.blk-h1 {
  font-size: 34rpx;
  font-weight: 600;
}
.blk-h2 {
  margin-top: 24rpx;
  font-size: 30rpx;
  font-weight: 600;
}
.blk-h3 {
  margin-top: 16rpx;
  font-weight: 600;
}
.blk-quote {
  padding-left: 16rpx;
  border-left: 6rpx solid #dfe1e5;
  color: $abr-color-text-secondary;
}
.b {
  font-weight: 600;
}
.hr {
  height: 1rpx;
  background: #dfe1e5;
  margin: 16rpx 0;
}
.row {
  display: flex;
  border-bottom: 1rpx solid #eef0f3;
  font-size: 24rpx;
}
.cell {
  flex: 1;
  padding: 8rpx;
  word-break: break-all;
}
</style>
