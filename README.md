<p align="center">
  <img src="https://raw.githubusercontent.com/zerob13/dsh-better-markdown/master/assets/banner.png" alt="dsh-better-markdown — fast streaming Markdown for DeepSeek Harness" width="100%" />
</p>

<h1 align="center">dsh-better-markdown</h1>

<p align="center">
  用 <a href="https://www.npmjs.com/package/markstream-react"><code>markstream-react</code></a>
  替换 DeepSeek Harness Web 的流式 Markdown 渲染链路。
</p>

<p align="center">
  <a href="https://github.com/zerob13/dsh-better-markdown/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/zerob13/dsh-better-markdown?style=flat" /></a>
  <a href="https://www.npmjs.com/package/dsh-better-markdown"><img alt="npm version" src="https://img.shields.io/npm/v/dsh-better-markdown?style=flat&color=111111" /></a>
  <a href="https://github.com/zerob13/dsh-better-markdown/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/zerob13/dsh-better-markdown/actions/workflows/ci.yml/badge.svg" /></a>
  <a href="https://opensource.org/licenses/MIT"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-111111.svg" /></a>
  <a href="https://github.com/deepseek-ai/DeepSeek-Harness"><img alt="DeepSeek Harness" src="https://img.shields.io/badge/DeepSeek_Harness-Web-111111.svg" /></a>
  <a href="https://www.npmjs.com/package/markstream-react"><img alt="markstream-react 0.0.55" src="https://img.shields.io/badge/markstream--react-0.0.55-111111.svg" /></a>
  <a href="https://mermaid.js.org/"><img alt="Mermaid 11" src="https://img.shields.io/badge/Mermaid-11-111111.svg" /></a>
</p>

<p align="center">
  <a href="https://github.com/zerob13/dsh-better-markdown/blob/master/README.md"><b>中文</b></a> · <a href="https://github.com/zerob13/dsh-better-markdown/blob/master/README_EN.md">English</a>
</p>

本仓库是 [zerob13/dsh-better-markdown](https://github.com/zerob13/dsh-better-markdown) 的 fork。优化版本通过本仓库的 GitHub Release 分发预构建 tarball；下文 npm 安装命令指向原作者版本，不能用于安装此 fork。下载 Release 附件后，使用 DSH 插件管理器安装该本地 tarball。包名保留以兼容 DSH 注册，设置 `private` 防止误发布到原 npm 包名。

`0.1.5` 修复 DSH `0.2.2` 中助手条目缺少文件引用注入而崩溃、回退到内置渲染器的问题：条目声明并渲染思考正文与图片子槽，按会话注入文件引用解析器，缺少可选服务时继续显示正文，保留旧宿主参数及 `priority: -100`。

> 验证：接口已按官方 `dsh-v0.2.2-alpha.3` 源码核对；用户已在其 DSH `0.2.2` 目标设备确认候选包能够正常渲染。该结果不代表所有预发布构建或浏览器均已验证。

本 fork 的 Mermaid 在围栏结束后生成图片模式预览，支持 YAML frontmatter、主题和源码切换；不再使用上游 Mermaid 组件的全屏、缩放与导出控件。Mermaid 图片节点在布局前拒绝并保留源码，避免外部图片请求阻塞后续图表。普通 Markdown 外部图片仍按原策略加载，并非断网模式。

`svg` 围栏在结束后显示图片预览和原始源码，支持省略 `xmlns` 的 SVG 片段；无效 XML、DOCTYPE 和超出长度上限的输入保留源码。预览在浏览器图片上下文运行，不把 SVG 注入宿主页面 DOM。

隔离 Chromium 回归已验证普通 Mermaid、frontmatter、SVG 片段、SVG 脚本与外链样例、图片节点拒绝及后续图表恢复。该验证不等同于当前 DSH 页面安装验收，也不覆盖所有浏览器或复杂图形的资源消耗。

`dsh-better-markdown` 是一个 DeepSeek Harness Web 客户端插件。安装后，Web 对话中所有带流式状态的 assistant Markdown 都由 `markstream-react` 解析和渲染；同一消息流结束后继续使用同一个 renderer，不会在完成瞬间切回另一套 Markdown 实现。

> `markstream-react` 是 [`Simon-He95/markstream-vue`](https://github.com/Simon-He95/markstream-vue) monorepo 提供的 React 版本。本插件在 Harness 中使用的是 React package，不会引入 Vue runtime。

## 为什么使用 Markstream React

- **面向流式输出**：可持续处理尚未闭合的粗体、代码围栏、列表、表格和数学表达式，适合 LLM token stream。
- **减少完成态切换**：流式与 settled assistant message 共用 Markstream renderer，避免完成时替换整棵 Markdown UI。
- **更丰富的 Markdown**：支持常用 Markdown、表格、任务列表、引用、链接、图片、KaTeX 数学公式和 Mermaid 图表。
- **兼容 Harness 滚动区**：关闭不适用于聊天内部滚动容器的 viewport lazy mounting，避免可见内容停留在骨架占位状态。
- **完整 Markstream 代码块**：fenced code 由 Markstream `MarkdownCodeBlockNode` 与 `stream-markdown` 渲染，使用 Shiki 流式高亮，并保留语言标题、复制和展开操作；reasoning、附件、停止状态仍保持 Harness 原行为。
- **安全边界明确**：原始 HTML 使用 `htmlPolicy="escape"`；链接、图片和 settled file mention 继续执行 Harness 的限制策略；Mermaid 使用 strict mode。

## 效果截图

### Markstream 代码块

<img src="https://raw.githubusercontent.com/zerob13/dsh-better-markdown/master/screenshot/code.png" alt="DeepSeek Harness code blocks rendered inside dsh-better-markdown" width="100%" />

### 图片、链接与 KaTeX 数学公式

<img src="https://raw.githubusercontent.com/zerob13/dsh-better-markdown/master/screenshot/math.png" alt="Images, links and KaTeX math rendered by dsh-better-markdown" width="100%" />

### Mermaid 图表

<img src="https://raw.githubusercontent.com/zerob13/dsh-better-markdown/master/screenshot/mermaid.png" alt="Interactive Mermaid flowchart rendered in DeepSeek Harness" width="100%" />

## 功能范围

| 能力 | 行为 |
|---|---|
| Assistant streaming Markdown | 全部交给 `markstream-react` |
| Settled assistant Markdown | 继续使用同一个 Markstream renderer |
| Mermaid | 插件内置 `mermaid@11.16.1`，无需额外安装 |
| Math | KaTeX inline / display math |
| Code fences | 使用 Markstream `MarkdownCodeBlockNode` + `stream-markdown` + Shiki；未知语言回退为可见纯文本 |
| Raw HTML | 转义为文本，不注入 DOM |
| Links and images | 仅允许安全的外部协议 |
| Plan review / trajectory 等静态 surface | 继续使用 Harness 内置 `MarkdownText`；这些 surface 没有统一替换 slot |

## 工作原理

插件使用 Harness 公开的 client module 与 slot shadowing，不修改 Harness 源码，也不替换全局 React。

```text
Assistant token stream
  -> Harness session projection
  -> conversation.chat.node / assistant-step
       |- priority -100: BetterAssistantNodeView
       |                  -> markstream-react  (active)
       |                       `- fenced code -> stream-markdown -> Shiki
       `- priority    0: Harness built-in      (fallback)
```

低优先级 shadow entry 负责正常渲染；如果插件 renderer 抛错或被卸载，Harness 原 renderer 仍在 slot 中并自动接管。

## 安装

### 从 npm 安装（推荐）

前置条件：DeepSeek Harness Web 可以正常启动。

```sh
dsh plugin --profile web add dsh-better-markdown
dsh --profile web --dump-config
dsh --profile web
```

更新插件：

```sh
dsh plugin --profile web add dsh-better-markdown@latest
```

### 从源码安装

前置条件：DeepSeek Harness Web 可以正常启动，Node.js 20+，pnpm 10+。

```sh
git clone https://github.com/zerob13/dsh-better-markdown.git
cd dsh-better-markdown
pnpm install
pnpm run check
pnpm run build
dsh plugin --profile web add "$(pwd)"
dsh --profile web --dump-config
dsh --profile web
```

Windows PowerShell 将 `"$(pwd)"` 替换为 `(Get-Location).Path`。

配置输出应包含：

```yaml
# == dsh-better-markdown
- id: better-markdown
  name: dsh-better-markdown
```

打开 Web 后，assistant Markdown 根节点会带有：

```html
<div data-markdown-renderer="markstream-react">
```

### 直接从 Git 安装

Git dependency 会执行本仓库的 `prepare` 构建。pnpm 10/11 可能要求在 Web profile 的 `pnpm-workspace.yaml` 中显式允许：

```yaml
allowBuilds:
  dsh-better-markdown: true
```

然后安装：

```sh
dsh plugin --profile web add git+https://github.com/zerob13/dsh-better-markdown.git
dsh --profile web
```

建议生产环境固定 commit SHA，而不是长期跟随默认分支。

## 移除

移除插件：

```sh
dsh plugin --profile web remove dsh-better-markdown
```

卸载会释放 slot shadow 和 Markstream component policy，Harness 内置 renderer 随即恢复。

## 体积与取舍

- `markstream-react`: `0.0.55`
- `mermaid`: `11.16.1`
- `stream-markdown`: `0.0.16`
- `shiki`: `4.4.3`
- 当前 browser bundle：约 7.40 MB，gzip 约 1.59 MB
- Mermaid 与 Shiki 代码高亮均被打包以保证离线可用；Shiki 使用纯 JavaScript 正则引擎与 34 种常用语言的 fine-grained bundle
- Monaco runtime、D2、Infographic 等可选 peer 没有打包；未知代码语言使用 Markstream 的纯文本回退

如果不需要 Mermaid，移除其 dependency 可以明显减小 bundle，但 Mermaid fence 将无法生成图形预览。

## 开发

```sh
pnpm install
pnpm run check
pnpm run build
pnpm pack --dry-run
```

维护者发布流程：先让 `package.json` 版本与 `vX.Y.Z` tag 保持一致，再发布对应的 GitHub Release。`publish.yml` 会验证版本、执行测试与构建，并通过 npm trusted publishing 发布公开包；prerelease 不会发布。

主要文件：

- `src/client/index.ts`：注册 Markstream component policy 和 assistant slot shadow
- `src/client/renderer.tsx`：assistant node 与 Markdown renderer
- `src/client/shiki.ts`：单文件插件使用的 fine-grained Shiki bundle
- `src/client/styles.css`：Harness token 适配
- `cordis.patch.yml`：插件 bundle row
- `tests/plugin.spec.tsx`：streaming、fallback、安全与 Mermaid 路由测试

## 兼容性

- DeepSeek Harness `0.1.0-rc.5` 及以上
- React 18 及以上
- 仅替换 Web conversation 的 `assistant-step`
- 旧版 Harness 如果没有 priority-based slot shadowing，会直接加载失败，避免出现双 renderer

## 致谢

- [DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness)
- [markstream-vue / markstream-react](https://github.com/Simon-He95/markstream-vue)
- [Mermaid](https://github.com/mermaid-js/mermaid)

## License

[MIT](./LICENSE)
