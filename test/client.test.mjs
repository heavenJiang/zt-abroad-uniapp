// 运行：npm test（node --test，不依赖 uni 运行时）
import { test } from "node:test"
import assert from "node:assert/strict"
import { createClient, TOKEN_KEY, VISITOR_HEADER } from "../src/utils/client.js"
import { recordLaunch, firstTouch, lastTouch, pickCodes } from "../src/utils/channel.js"

function memoryStore() {
  const m = new Map()
  return { get: k => (m.has(k) ? m.get(k) : null), set: (k, v) => m.set(k, v), remove: k => m.delete(k), map: m }
}

/** 假后端：记录请求，按路由返回 */
function fakeBackend(routes) {
  const calls = []
  const transport = async opts => {
    calls.push(opts)
    const handler = routes[opts.method + " " + opts.url.replace(/^https?:\/\/[^/]+/, "")]
    if (!handler) {
      return { statusCode: 404, data: {} }
    }
    return { statusCode: 200, data: handler(opts, calls) }
  }
  return { transport, calls }
}

const TOKEN_A = "a".repeat(43)
const TOKEN_B = "b".repeat(43)

test("渠道码：格式校验、首次只记一次、最近一次覆盖", () => {
  assert.deepEqual(pickCodes({ ch: "xhs_01", ct: "note-9" }), { channelCode: "xhs_01", contentCode: "note-9" })
  assert.deepEqual(pickCodes({ channel: "zhihu", content: "a b" }), { channelCode: "zhihu", contentCode: null })
  assert.deepEqual(pickCodes({ ch: "x".repeat(33) }), { channelCode: null, contentCode: null })
  assert.deepEqual(pickCodes(null), { channelCode: null, contentCode: null })
  const store = memoryStore()
  recordLaunch({ ch: "xhs", ct: "n1" }, store)
  recordLaunch({}, store)
  recordLaunch({ ch: "dy" }, store)
  assert.equal(firstTouch(store).channelCode, "xhs")
  assert.equal(firstTouch(store).contentCode, "n1")
  assert.equal(lastTouch(store).channelCode, "dy")
  const empty = memoryStore()
  recordLaunch({}, empty)
  assert.equal(lastTouch(empty).channelCode, null)
})

test("首次请求先取访客令牌，透传首次渠道与端，之后带令牌", async () => {
  const store = memoryStore()
  recordLaunch({ ch: "xhs", ct: "n1" }, store)
  const { transport, calls } = fakeBackend({
    "POST /app/visitor": () => ({ code: 200, visitorToken: TOKEN_A }),
    "GET /app/assessment/degrees": () => ({ code: 200, data: [1] })
  })
  const client = createClient({ transport, store, baseUrl: "", platform: "h5" })
  const [r1, r2] = await Promise.all([client.request("/app/assessment/degrees"), client.request("/app/assessment/degrees")])
  assert.deepEqual(r1.data, [1])
  assert.deepEqual(r2.data, [1])
  // 并发只创建一次访客
  assert.equal(calls.filter(c => c.url === "/app/visitor").length, 1)
  assert.deepEqual(calls[0].data, { channelCode: "xhs", contentCode: "n1", clientPlatform: "h5" })
  assert.equal(calls[1].header[VISITOR_HEADER], TOKEN_A)
  assert.equal(store.get(TOKEN_KEY), TOKEN_A)
})

test("访客失效（401）时换新令牌重试一次；再失败则报错", async () => {
  const store = memoryStore()
  store.set(TOKEN_KEY, TOKEN_A)
  let visitorCalls = 0
  const { transport, calls } = fakeBackend({
    "POST /app/visitor": () => ({ code: 200, visitorToken: (++visitorCalls, TOKEN_B) }),
    "GET /app/x/ok": opts => (opts.header[VISITOR_HEADER] === TOKEN_A ? { code: 401, msg: "访客身份已失效" } : { code: 200, data: "ok" }),
    "GET /app/x/always401": () => ({ code: 401, msg: "访客身份已失效" })
  })
  const client = createClient({ transport, store, baseUrl: "https://api.example.com", platform: "mp_weixin" })
  const res = await client.request("/app/x/ok")
  assert.equal(res.data, "ok")
  assert.equal(store.get(TOKEN_KEY), TOKEN_B)
  assert.equal(visitorCalls, 1)
  assert.ok(calls.every(c => c.url.startsWith("https://api.example.com/app/")))
  await assert.rejects(client.request("/app/x/always401"), { message: "访客身份已失效", code: 401 })
})

test("只允许 /app/**；业务错误与 HTTP 错误都抛出", async () => {
  const store = memoryStore()
  store.set(TOKEN_KEY, TOKEN_A)
  const { transport } = fakeBackend({
    "POST /app/x/bad": () => ({ code: 500, msg: "学段不正确" })
  })
  const client = createClient({ transport, store, baseUrl: "", platform: "h5" })
  await assert.rejects(client.request("/abroad/assessment/list"), /只能请求 \/app\/\*\*/)
  await assert.rejects(client.request("/system/user/list"), /只能请求/)
  await assert.rejects(client.request("/app/x/bad", { method: "POST", data: {} }), { message: "学段不正确", code: 500 })
  await assert.rejects(client.request("/app/x/missing"), { status: 404 })
})

test("取访客令牌失败时报错，下次可重新尝试", async () => {
  const store = memoryStore()
  let fail = true
  const { transport } = fakeBackend({
    "POST /app/visitor": () => (fail ? { code: 500, msg: "服务繁忙" } : { code: 200, visitorToken: TOKEN_A }),
    "GET /app/x/ok": () => ({ code: 200, data: 1 })
  })
  const client = createClient({ transport, store, baseUrl: "", platform: "h5" })
  await assert.rejects(client.request("/app/x/ok"), { message: "服务繁忙" })
  fail = false
  assert.equal((await client.request("/app/x/ok")).data, 1)
})
