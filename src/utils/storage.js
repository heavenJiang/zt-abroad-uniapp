/**
 * 本地存储（uni 同步存储；读写失败时不影响页面，按无数据处理）
 */
export const storage = {
  get(key) {
    try {
      const v = uni.getStorageSync(key)
      return v === "" ? null : v
    } catch (e) {
      return null
    }
  },
  set(key, value) {
    try {
      uni.setStorageSync(key, value)
    } catch (e) {
      // 存储不可用（如隐私模式）时只在本次会话内生效
    }
  },
  remove(key) {
    try {
      uni.removeStorageSync(key)
    } catch (e) {
      // 忽略
    }
  }
}
