import { defineConfig, loadEnv } from "vite"
import uni from "@dcloudio/vite-plugin-uni"

// C 端只调用后端 /app/**；开发时 H5 把 /app 代理到本地后端（默认 http://localhost:8090）
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    plugins: [uni()],
    server: {
      port: 5173,
      proxy: {
        "/app": {
          target: env.VITE_DEV_PROXY_TARGET || "http://localhost:8090",
          changeOrigin: true
        }
      }
    }
  }
})
