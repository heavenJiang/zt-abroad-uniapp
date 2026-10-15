<template>
  <view class="page">
    <view v-if="loading" class="hint">加载中…</view>
    <view v-else-if="error" class="hint">
      <text>{{ error }}</text>
      <button size="mini" class="retry" @click="load">重试</button>
    </view>
    <template v-else>
      <view class="title">30 秒快测</view>
      <view class="subtitle">填 4 项，马上看各国家 / 地区的冲、稳、保和代表院校</view>

      <!-- 1 本科学校 -->
      <view class="card">
        <view class="q">{{ titleOf("undergrad_school", "本科学校") }}</view>
        <view v-if="form.school" class="picked">
          <text>{{ schoolText }}</text>
          <text class="change" @click="clearSchool">修改</text>
        </view>
        <template v-else>
          <input class="input" :value="keyword" placeholder="输入校名或简称，如“北航”" @input="onKeyword" />
          <view v-if="searching" class="tip">搜索中…</view>
          <view v-for="u in results" :key="u.universityId" class="option" @click="pickSchool(u)">{{ u.name }}</view>
          <view v-if="keyword.length >= 2 && !searching && !results.length" class="tip">没有找到，可以选下面的选项</view>
          <view class="specials">
            <view class="link" @click="pickSpecial('overseas')">我在海外读本科</view>
            <view class="link" @click="pickSpecial('not_found')">搜不到我的学校</view>
          </view>
        </template>
      </view>

      <!-- 2 均分 -->
      <view class="card">
        <view class="q">{{ titleOf("gpa", "目前的均分 / GPA") }}</view>
        <view class="chips">
          <view v-for="s in scales" :key="s.value" :class="['chip', { active: form.gpaType === s.value }]" @click="form.gpaType = s.value">
            {{ s.label }}
          </view>
        </view>
        <view class="row">
          <input class="input grow" type="digit" :value="form.gpaTotal" :placeholder="gpaPlaceholder" @input="e => (form.gpaTotal = e.detail.value)" />
          <template v-if="currentScale && currentScale.requires_max">
            <text class="sep">满分</text>
            <input class="input small" type="digit" :value="form.gpaMax" placeholder="如 10" @input="e => (form.gpaMax = e.detail.value)" />
          </template>
        </view>
        <view class="tip">在读填到目前为止的成绩</view>
      </view>

      <!-- 3 目标国家 / 地区 -->
      <view class="card">
        <view class="q">{{ titleOf("target_countries", "想去哪些国家 / 地区？") }}（可多选）</view>
        <view class="chips">
          <view v-for="c in countries" :key="c.value" :class="['chip', { active: form.countries.includes(c.value), closed: !c.open }]"
            @click="toggleCountry(c.value)">
            {{ c.label }}<text v-if="!c.open" class="soon">即将开放</text>
          </view>
        </view>
      </view>

      <!-- 4 专业方向 -->
      <view class="card">
        <view class="q">{{ titleOf("target_field", "想读什么专业方向？") }}</view>
        <view v-for="g in fieldGroups" :key="g.value" class="group">
          <view class="group-label">{{ g.label }}</view>
          <view class="chips">
            <view v-for="o in g.options" :key="o.value" :class="['chip', { active: form.field === o.value }]" @click="form.field = o.value">
              {{ o.label }}
            </view>
          </view>
        </view>
      </view>

      <!-- 隐私同意（默认不勾选） -->
      <view class="consent" @click="form.agreed = !form.agreed">
        <view :class="['box', { on: form.agreed }]">{{ form.agreed ? "✓" : "" }}</view>
        <view class="consent-text">
          <text>我已阅读并同意</text>
          <text class="link inline" @click.stop="openPolicy">《隐私政策》</text>
          <text>（版本 {{ policy.version }}）。快测只用于计算选校定位，不需要姓名和手机号。</text>
          <text v-if="policy.draft" class="draft">草案，尚未经律师审阅，仅用于测试</text>
        </view>
      </view>

      <button class="primary" :loading="submitting" :disabled="submitting" @click="submit">查看结果</button>
      <view class="footer">结果由选校引擎按院校库公开要求计算，仅供参考，不代表录取承诺。</view>
    </template>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from "vue"
import { onLoad } from "@dcloudio/uni-app"
import { getQuickForm, runQuick, searchUniversity } from "@/api/tool.js"
import { getPolicy, PRIVACY_POLICY } from "@/api/policy.js"
import { storage } from "@/utils/storage.js"
import { validateQuick, buildAnswers, formFromAnswers } from "@/utils/quick.js"

/** 上次填写的答案（本机保存，方便重测；结果页从 RESULT_KEY 读取） */
const LAST_KEY = "abr_quick_last"
const RESULT_KEY = "abr_quick_result"

const degree = ref("master")
const loading = ref(true)
const error = ref("")
const submitting = ref(false)
const def = ref({ questions: [], countries: [] })
const policy = ref({})
const keyword = ref("")
const results = ref([])
const searching = ref(false)
const form = reactive({ school: null, gpaType: "percent", gpaTotal: "", gpaMax: "", countries: [], field: "", agreed: false })
let timer = null
let seq = 0

const questions = computed(() => Object.fromEntries((def.value.questions || []).map(q => [q.id, q])))
const scales = computed(() => (questions.value.gpa && questions.value.gpa.score_types) || [])
const currentScale = computed(() => scales.value.find(s => s.value === form.gpaType))
const countries = computed(() => def.value.countries || [])
const openCountries = computed(() => countries.value.filter(c => c.open).map(c => c.value))
const gpaPlaceholder = computed(() => {
  const s = currentScale.value
  return s && s.total && s.total.max != null ? "0–" + s.total.max : "如 8.5"
})
const schoolText = computed(() => {
  if (!form.school) {
    return ""
  }
  if (form.school.kind === "overseas") {
    return "海外本科"
  }
  if (form.school.kind === "not_found") {
    return form.school.name ? form.school.name + "（未收录）" : "搜不到我的学校"
  }
  return form.school.name
})
const fieldGroups = computed(() => {
  const q = questions.value.target_field
  if (!q) {
    return []
  }
  const groups = (q.groups || []).map(g => ({ ...g, options: q.options.filter(o => o.group === g.value) }))
  return groups.filter(g => g.options.length)
})

function titleOf(id, fallback) {
  return (questions.value[id] && questions.value[id].title) || fallback
}

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

function pickSchool(u) {
  form.school = { kind: "cn", university_id: u.universityId, name: u.name }
}

function pickSpecial(kind) {
  form.school = { kind, university_id: null, name: kind === "not_found" ? keyword.value : "" }
}

function clearSchool() {
  form.school = null
  results.value = []
}

function toggleCountry(value) {
  const i = form.countries.indexOf(value)
  if (i >= 0) {
    form.countries.splice(i, 1)
  } else {
    form.countries.push(value)
  }
}

function openPolicy() {
  uni.navigateTo({ url: "/pages/policy/index" })
}

async function load() {
  loading.value = true
  error.value = ""
  try {
    def.value = await getQuickForm(degree.value)
    policy.value = await getPolicy(def.value.policyCode || PRIVACY_POLICY)
    const last = formFromAnswers(storage.get(LAST_KEY))
    Object.assign(form, last)
    if (!scales.value.some(s => s.value === form.gpaType) && scales.value.length) {
      form.gpaType = scales.value[0].value
    }
  } catch (e) {
    error.value = e.message || "加载失败"
  } finally {
    loading.value = false
  }
}

async function submit() {
  const msg = validateQuick(form, { scales: scales.value, openCountries: openCountries.value })
  if (msg) {
    uni.showToast({ title: msg, icon: "none" })
    return
  }
  submitting.value = true
  const answers = buildAnswers(form)
  try {
    const result = await runQuick({ answers, policyVersion: policy.value.version, degree: degree.value })
    storage.set(LAST_KEY, answers)
    storage.set(RESULT_KEY, result)
    uni.navigateTo({ url: "/pages/quick/result" })
  } catch (e) {
    uni.showToast({ title: e.message || "计算失败，请重试", icon: "none" })
    if (e.message && e.message.includes("隐私政策已更新")) {
      form.agreed = false
      load()
    }
  } finally {
    submitting.value = false
  }
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
.title {
  font-size: 44rpx;
  font-weight: 700;
}
.subtitle,
.tip,
.hint,
.footer {
  margin-top: 12rpx;
  color: $abr-color-text-secondary;
  font-size: 26rpx;
}
.hint {
  text-align: center;
}
.card {
  margin-top: 28rpx;
  padding: 28rpx;
  background: #ffffff;
  border-radius: $abr-radius;
}
.q {
  font-weight: 600;
  margin-bottom: 16rpx;
}
.input {
  height: 80rpx;
  padding: 0 24rpx;
  border-radius: $abr-radius;
  background: #f2f3f5;
}
.row {
  display: flex;
  align-items: center;
  margin-top: 16rpx;
}
.grow {
  flex: 1;
}
.small {
  width: 160rpx;
}
.sep {
  margin: 0 16rpx;
  color: $abr-color-text-secondary;
}
.option {
  padding: 20rpx 8rpx;
  border-bottom: 1rpx solid #f0f1f3;
}
.picked {
  display: flex;
  justify-content: space-between;
}
.change,
.link {
  color: $abr-color-primary;
}
.specials {
  display: flex;
  gap: 32rpx;
  margin-top: 16rpx;
  font-size: 26rpx;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.chip {
  padding: 12rpx 28rpx;
  border-radius: 999rpx;
  background: #f2f3f5;
  font-size: 26rpx;
}
.chip.active {
  background: $abr-color-primary;
  color: #ffffff;
}
.chip.closed:not(.active) {
  color: #a0a4ab;
}
.soon {
  margin-left: 8rpx;
  font-size: 20rpx;
}
.group {
  margin-top: 12rpx;
}
.group-label {
  margin: 8rpx 0;
  font-size: 24rpx;
  color: $abr-color-text-secondary;
}
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
.inline {
  display: inline;
}
.draft {
  display: block;
  color: #b25e09;
}
.primary {
  margin-top: 32rpx;
  background: $abr-color-primary;
  color: #ffffff;
  border-radius: 999rpx;
}
.footer {
  text-align: center;
  font-size: 22rpx;
}
.retry {
  margin-left: 16rpx;
}
</style>
