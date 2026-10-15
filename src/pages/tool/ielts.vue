<template>
  <view class="page">
    <view class="title">雅思够不够</view>
    <view class="muted">输入雅思成绩，看哪些项目已经达标、哪些还差多少</view>
    <view v-if="error" class="hint">
      <text>{{ error }}</text>
      <button size="mini" class="retry" @click="load">重试</button>
    </view>
    <template v-else-if="def">
      <view class="card">
        <view class="q">雅思成绩</view>
        <view class="row">
          <input class="input grow" type="digit" :value="form.total" placeholder="总分，如 6.5" @input="e => (form.total = e.detail.value)" />
          <input class="input grow" type="digit" :value="form.minSub" placeholder="最低小分（选填）" @input="e => (form.minSub = e.detail.value)" />
        </view>
        <view class="muted small">不少项目对小分有要求，填上更准</view>
      </view>
      <view class="card">
        <view class="q">目标国家 / 地区（可多选）</view>
        <view class="chips">
          <view v-for="c in def.countries" :key="c.value" :class="['chip', { active: form.countries.includes(c.value), closed: !c.open }]"
            @click="toggle(c.value)">
            {{ c.label }}<text v-if="!c.open" class="soon">即将开放</text>
          </view>
        </view>
      </view>
      <view class="card">
        <view class="q">专业方向（选填）</view>
        <picker :range="fieldOptions" range-key="label" :value="fieldIndex" @change="e => (form.field = fieldOptions[e.detail.value].value)">
          <view class="input picker">{{ fieldLabel }}</view>
        </picker>
      </view>
      <consent-check v-model="form.agreed" :policy-code="def.policyCode" @policy="p => (policy = p)" />
      <button class="primary" :loading="submitting" :disabled="submitting" @click="submit">看看够不够</button>

      <template v-if="result">
        <view class="card summary">你的成绩：{{ result.score }}</view>
        <view v-for="c in result.countries" :key="c.country" class="card">
          <view class="country">{{ c.label }}</view>
          <view class="muted">
            达标 {{ c.metCount }} · 读语言班可达标 {{ c.preSessionalCount }} · 未达标 {{ c.notMetCount }}<text v-if="c.uncheckedCount"> · 无法判断 {{ c.uncheckedCount }}</text>
          </view>
          <view v-if="!c.programs.length" class="muted small">院校库暂无符合条件的英语授课项目</view>
          <view v-for="p in c.programs" :key="p.programId" class="program">
            <view class="program-main">
              <view class="school">{{ p.schoolName }}</view>
              <view class="name">{{ p.programName }}</view>
              <view class="line"><text :class="['tag', p.outcome]">{{ IELTS_OUTCOMES[p.outcome] }}</text>{{ ieltsText(p) }}</view>
            </view>
            <view :class="['add', { done: added.has(p.programId) }]" @click="add(p.programId, result.toolRunId)">
              {{ added.has(p.programId) ? "已加入" : "加入选校单" }}
            </view>
          </view>
        </view>
        <view v-if="result.closedCountries.length" class="muted small">
          {{ result.closedCountries.map(c => c.label).join("、") }} 暂未开放。
        </view>
        <view class="footer">要求来自院校库，仅供参考，以项目官网为准。</view>
      </template>
    </template>
    <view v-else class="hint">加载中…</view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from "vue"
import { onLoad, onShow } from "@dcloudio/uni-app"
import ConsentCheck from "@/components/ConsentCheck.vue"
import { getToolForm, runTool } from "@/api/tool.js"
import { storage } from "@/utils/storage.js"
import { CONSENT_KEY } from "@/utils/quick.js"
import { IELTS_OUTCOMES, ieltsText, validateIeltsForm } from "@/utils/tools.js"
import { usePlan } from "@/utils/usePlan.js"

const LAST_KEY = "abr_tool_ielts_last"

const def = ref(null)
const error = ref("")
const policy = ref({})
const submitting = ref(false)
const result = ref(null)
const form = reactive({ total: "", minSub: "", countries: [], field: "", agreed: false, ...(storage.get(LAST_KEY) || {}) })
const { added, add, refresh } = usePlan()

const fieldOptions = computed(() => {
  const q = def.value && def.value.questions.find(x => x.id === "target_field")
  return [{ value: "", label: "不限" }, ...((q && q.options) || []).filter(o => o.value !== "undecided")]
})
const fieldIndex = computed(() => Math.max(0, fieldOptions.value.findIndex(o => o.value === form.field)))
const fieldLabel = computed(() => fieldOptions.value[fieldIndex.value].label)

function toggle(value) {
  const i = form.countries.indexOf(value)
  if (i >= 0) {
    form.countries.splice(i, 1)
  } else {
    form.countries.push(value)
  }
}

async function load() {
  error.value = ""
  try {
    def.value = await getToolForm("ielts", "master")
  } catch (e) {
    error.value = e.message || "加载失败"
  }
}

async function submit() {
  const open = def.value.countries.filter(c => c.open).map(c => c.value)
  const msg = validateIeltsForm(form, open)
  if (msg) {
    uni.showToast({ title: msg, icon: "none" })
    return
  }
  submitting.value = true
  const answers = {
    english_score: { type: "ielts", total: Number(form.total), min_sub: form.minSub === "" ? null : Number(form.minSub) },
    target_countries: [...form.countries],
    target_field: form.field || null
  }
  try {
    result.value = await runTool("ielts", { answers, policyVersion: policy.value.version, degree: "master" })
    storage.set(LAST_KEY, { total: form.total, minSub: form.minSub, countries: [...form.countries], field: form.field })
    storage.set(CONSENT_KEY, policy.value.version)
  } catch (e) {
    uni.showToast({ title: e.message || "查询失败，请重试", icon: "none" })
  } finally {
    submitting.value = false
  }
}

onLoad(load)
onShow(refresh)
</script>

<style lang="scss" scoped>
@import "./tool.scss";
.picker {
  display: flex;
  align-items: center;
}
.summary {
  font-weight: 600;
}
.tag {
  margin-right: 12rpx;
  padding: 2rpx 12rpx;
  border-radius: 6rpx;
  color: #ffffff;
  background: #868e96;
}
.tag.met {
  background: #2b8a3e;
}
.tag.pre_sessional {
  background: $abr-color-primary;
}
.tag.not_met {
  background: #e8590c;
}
</style>
