/**
 * dsh-filepath-drop — host (Node) entry.
 *
 * 全部行为都在渲染进程的 client 中完成；host 只声明插件身份，
 * 使 cordis 能够加载并在「设置 → 插件」里启用/禁用它。
 */

export const name = "dsh-filepath-drop";

export function apply(_ctx) {
  // Intentionally empty. See lib/client.js for the implementation.
}
