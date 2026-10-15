<script setup>
import { onLaunch } from "@dcloudio/uni-app"
import { recordLaunch } from "@/utils/channel.js"
import { storage } from "@/utils/storage.js"
import { ensureVisitor } from "@/api/request.js"

// 记录入口渠道（首次 / 最近一次），并预先取得匿名访客令牌
onLaunch(options => {
  recordLaunch((options && options.query) || {}, storage)
  ensureVisitor().catch(() => {
    // 首屏请求会再次尝试并提示，这里不打扰用户
  })
})
</script>

<style>
page {
  background-color: #f6f7f9;
  color: #1f2329;
  font-size: 28rpx;
}
</style>
