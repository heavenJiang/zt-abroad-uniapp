/**
 * 请求ID（创建测评等写操作防重复提交；后端格式 [A-Za-z0-9_-]{8,64}）
 */
export function requestId() {
  const hex = "0123456789abcdef"
  let out = ""
  for (let i = 0; i < 32; i++) {
    out += hex[Math.floor(Math.random() * 16)]
  }
  return out.slice(0, 8) + "-" + out.slice(8, 12) + "-" + out.slice(12, 16) + "-" + out.slice(16, 20) + "-" + out.slice(20)
}
