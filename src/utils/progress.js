/**
 * 问卷进度：断点所在屏 → 第几步（落地页“继续上次测评（第 N / 5 步）”）
 */

/**
 * @param {object} definition 问卷定义（steps[].screens[].id）
 * @param {string} currentScreen 断点屏 id
 * @returns {{step: number, total: number}} step 从 1 开始；找不到断点时为 1
 */
export function stepOf(definition, currentScreen) {
  const steps = (definition && Array.isArray(definition.steps)) ? definition.steps : []
  const total = steps.length
  const index = steps.findIndex(s => Array.isArray(s.screens) && s.screens.some(sc => sc.id === currentScreen))
  return { step: index >= 0 ? index + 1 : 1, total }
}
