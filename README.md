# dsh-filepath-drop

> 用「拖入文件即插入路径」替换掉 DSH 的「拖入文件即上传」。

一个 [DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness) 插件：开启后，会**接管并替换 DSH 自带的文件插入操作**——DSH 原本的行为是「把文件拖进窗口 = 作为附件上传」，启用本插件后，同一个拖放动作的结果变为「在当前会话输入框的**光标位置**插入该文件的**本地绝对路径文本**」，文件**不会真的被上传或嵌入**，只是被引用。

![MIT](https://img.shields.io/badge/license-MIT-blue.svg) ![version](https://img.shields.io/badge/version-1.2.0-green.svg)

## 功能

- **替换 DSH 默认的文件插入行为**：原本「拖入文件 = 上传附件」，启用后变为「插入路径文本」，文件既不上传也不嵌入。
- 拖入单个或多个文件（含文件夹），路径以纯文本插入光标处（多文件每行一个）。
- 在 `document` 捕获阶段拦截拖放，先于附件上传类插件执行，从根源上阻止上传。
- 纯文本拖放（选中的文字）不受影响，仍保持 DSH 原有行为。
- 通过 DSH 的插件开关即可启用/禁用，无需改代码。


## ⚠️ 重要前提：DSH 不能以管理员身份运行

Windows 有一个安全机制叫 **UIPI（用户界面特权隔离）**：当 DSH 以管理员身份（提权）运行，而资源管理器是普通权限时，系统会**直接拦截从资源管理器拖入 DSH 的文件**——表现为鼠标显示“禁止”图标，且网页根本收不到任何拖放事件。这是系统级限制，**任何插件代码都无法绕过**。

因此使用本插件前，请确认 DSH **不是**以管理员身份运行的：

- 检查方法：任务管理器 → 详细信息 → 找到 `DeepSeek Harness.exe`，查看它的“提升”状态。
- 如果不小心以管理员身份打开了：**完全退出 DSH（包括托盘图标），然后从资源管理器里正常双击启动**（不要右键“以管理员身份运行”）。
- DSH 程序本身并不要求管理员权限（它的 manifest 是 `asInvoker`），普通权限启动完全可行。

在此前提下，拖入文件、文件夹都会正常工作。

## 安装

### 方式一：作为本地插件安装（开发 / 自用）

1. 把本仓库克隆到本地，记下目录绝对路径。
2. 在 `~/.dsh/profiles/desktop/package.json` 中：
   - `dependencies` 增加：`"dsh-filepath-drop": "link:<你的目录>/dsh-filepath-drop"`
   - `dsh.profile.bundles` 数组增加：`"dsh-filepath-drop"`
3. 重启 DSH。

### 方式二：发布到 npm 后安装

```bash
# 在 DSH profile 目录下
npm install dsh-filepath-drop
```

然后按方式一的第 2 步把插件名加入 `dsh.profile.bundles`，重启 DSH。

> 若通过 DSH 的插件管理器安装，通常会自动写入 bundle，无需手动改 `package.json`。

## 使用

1. 确认插件已启用（DSH「设置 → 插件」中 `dsh-filepath-drop` 为开启状态）。
2. 确认 DSH **不是**以管理员身份运行（见上方“重要前提”）。
3. 在会话输入框中把光标放到想插入的位置。
4. 从资源管理器拖入一个或多个文件（或文件夹）到 DSH 窗口。
5. 输入框光标处出现文件的本地绝对路径，例如 `C:\Users\me\Documents\report.pdf`，且没有产生任何附件。

### 关闭插件

在「设置 → 插件」中禁用 `dsh-filepath-drop` 即可。关闭后拖入文件恢复 DSH 的默认上传行为。
也可以编辑本插件的 `cordis.patch.yml`，给插入项增加 `disabled: true`。

## 工作原理

- 渲染进程 client 在 `document` 捕获阶段监听 `dragenter` / `dragover` / `drop`：先读取文件并插入路径文本，再把 `drop` 事件的 `dataTransfer` 替换为空文件版本。这样官方附件模块拿不到文件（不会上传），但它的 `reset()` 仍能正常执行以清除拖放遮罩。
- 通过宿主 preload 暴露的 `window.__DSH_HOST_PATHS__.pathFor(file)`（内部为 Electron `webUtils.getPathForFile`）取得真实本地路径；不可用时回退到 `file.path`。
- 用 `document.execCommand("insertText")` 在光标处插入文本，以保留撤销栈并触发框架的 `input` 事件；失败时改用原型 `value` setter + `input` 事件兜底。
- host 端 `lib/index.js` 只声明插件身份，无业务逻辑。

## 权限与隐私说明

- **运行权限**：插件本身不申请任何额外的系统权限，也不需要管理员权限。恰恰相反，DSH 必须以**普通（非管理员）权限**运行，否则受 Windows UIPI 限制，文件拖放会被系统拦截（见“重要前提”）。
- **文件访问**：拖入文件时，插件通过 DSH 宿主接口 `window.__DSH_HOST_PATHS__.pathFor()`（内部调用 Electron `webUtils.getPathForFile`）读取文件的**本地绝对路径**，仅获取路径字符串，不读取文件内容。
- **数据去向**：路径仅以纯文本插入当前输入框，由你决定是否发送；插件**不读取文件内容、不上传文件、不向任何外部服务器发送路径**。
- **本地存储**：插件不收集、不存储任何用户数据，也不发送遥测信息。

## 兼容性

- 需要 DSH 版本在渲染进程暴露 `window.__DSH_HOST_PATHS__.pathFor`（较新版本的 Electron 宿主均提供）。
- 插件 client 平台为 `web`，随桌面会话窗口加载。
- **DSH 必须以普通权限（非管理员）运行**，否则受 Windows UIPI 限制，拖放文件会被系统拦截（详见“重要前提”）。

## 故障排查

- **拖入文件显示“禁止”图标、完全没反应**：99% 是 DSH 以管理员身份运行导致的 UIPI 拦截（见“重要前提”）。请完全退出 DSH 后以普通权限重新启动，这是系统级限制，改插件代码无法解决。可用任务管理器确认 `DeepSeek Harness.exe` 的“提升”状态。
- **拖入后没有插入路径**：确认 DSH 非管理员权限后，打开 DevTools 查看 `[dsh-filepath-drop]` 相关日志；常见原因是宿主未暴露路径 API 或输入框选择器变化。
- **文件仍被上传**：确认本插件在「设置 → 插件」中是启用状态，且没有其他插件在 `document` 捕获阶段更早地替换了 `dataTransfer`。
- **插入位置不对**：插件优先使用当前聚焦的输入框；若拖放时焦点不在输入框，会回退到 DSH 的输入框 `[data-composer-input]`（Lexical 编辑器）。

## 开发

```bash
npm run check   # 对两个 JS 入口做语法检查
```

## 发布前检查清单

- 在 `package.json` 中补充 `repository`、`homepage`、`bugs` 字段指向你的 GitHub 仓库。
- 确认 `LICENSE` 中的版权信息符合你的要求。
- 运行 `npm run check`，并在真实 DSH 窗口中实测拖放。

## 免责声明

- 本插件按“现状”（AS IS）提供，作者不作任何明示或暗示的保证，包括但不限于适销性、特定用途适用性与不侵权性。
- 拖放功能依赖 Windows UIPI 机制及 DSH 内部实现（如 `window.__DSH_HOST_PATHS__`、输入框选择器）。若 DSH 版本更新、以管理员权限运行或系统策略变化导致功能异常，作者不承担由此产生的任何责任。
- 你应自行评估在本机使用该插件的风险并自行承担后果；因使用本插件造成的任何数据丢失、路径信息泄露或其他损失，作者概不负责。
- 完整法律条款参见 [MIT 许可证](./LICENSE)。

## License

[MIT](./LICENSE)
