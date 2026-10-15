/**
 * C 端请求入口：所有接口都通过这里调用（只允许 /app/**）
 */
import { createClient } from "@/utils/client.js"
import { storage } from "@/utils/storage.js"
import { BASE_URL, PLATFORM } from "@/utils/env.js"

function transport({ url, method, data, header }) {
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method,
      data,
      header: { "Content-Type": "application/json", ...header },
      timeout: 15000,
      success: res => resolve({ statusCode: res.statusCode, data: res.data }),
      fail: () => reject(new Error("网络连接失败，请检查网络后重试"))
    })
  })
}

const client = createClient({ transport, store: storage, baseUrl: BASE_URL, platform: PLATFORM })

export const request = client.request
export const ensureVisitor = client.ensureVisitor
