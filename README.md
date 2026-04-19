<p align="center">
  <a href="https://github.com/wangrongding/wallpaper-box" target="_blank">
    <img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301021532343.svg" width="300" alt="wallpaper-box logo"/>
  </a>
</p>

🏞️ `wallpaper-box` 想做的不只是另一个壁纸下载器，而是一个让桌面真正活起来的客户端：静态壁纸、视频壁纸、网页壁纸、AI 壁纸，再加上会跑的 RunCat 托盘动画。

## 功能概览

- [x] AI 文生图壁纸
- [x] 浏览和搜索在线壁纸
- [x] 下载壁纸到本地
- [x] 设置静态壁纸
- [x] 设置视频壁纸（在 MacOS 中，全屏动态壁纸，并没有完全覆盖整块屏幕，欢迎知道如何处理的小伙伴提 PR）
- [x] 支持通过 `yt-dlp` 下载 YouTube / Bilibili 视频后直接设为视频壁纸
- [x] 设置网页壁纸
- [x] 支持通过提示词生成 AI 壁纸
- [x] 支持在线 URL 和本地 HTML 文件作为网页壁纸
- [x] RunCat 动态托盘图标，根据 CPU 使用情况改变切换速度
- [x] 支持开机自启
- [x] 支持 HTTP 代理配置

## 平台说明

- 当前仓库内置的打包脚本以 macOS 为主。
- 默认构建产物是 `universal`，同时兼容 Apple Silicon 和 Intel Mac。
- 也提供单独的 `x64` / `arm64` 构建命令。
- 当前构建配置的最低 macOS 版本是 `10.13`。
- 应用未做开发者签名，首次打开需要手动放行。

## 使用

### 壁纸列表

壁纸来源于 wallhaven.cc。

- 支持搜索、筛选、预览、下载和直接设置。
- 下载的静态壁纸默认保存在 `~/wallpaper-box`。

<table>
  <tr>
     <td width="50%" align="center"><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301021543565.png"/></td>
     <td width="50%" align="center"><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301021752830.gif"/></td>
  </tr>
</table>

### 动态壁纸

目前支持将本地视频文件设置为桌面动态壁纸，也支持通过 `yt-dlp` 下载在线视频后直接作为壁纸。

- 支持点击选择或拖拽视频文件。
- 支持粘贴 `YouTube / Bilibili` 链接下载视频。
- 常见格式如 `MP4`、`MOV`、`WebM` 均可尝试。
- macOS 下动态壁纸窗口的铺满效果仍有继续优化空间，欢迎 PR。

<img width="1441" height="900" alt="image" src="https://github.com/user-attachments/assets/ad7e851d-6c14-4780-87d4-bf0c4d1651da" />

说明：

- 视频下载默认保存到 `~/wallpaper-box/videos`
- 下载完成后会自动设为视频壁纸
- 当前仓库默认按 macOS 打包，发布包里可以直接内置 `yt-dlp` 与 `Deno`，用户无需手动安装
- 某些 `Bilibili / YouTube` 视频只提供分离音视频流，这类链接还需要把 `ffmpeg` 和 `ffprobe` 一起打进 `resources/bin/`
- 如果你使用官方 `yt-dlp_macos` 二进制，视频下载功能的有效最低系统版本会更接近 `macOS 10.15+`

<table>
  <tr>
      <td width="50%" align="center"><b>Windows 中的效果：</b></td>
      <td width="50%" align="center"><b>MacOS 中的效果：</b></td>
  </tr>
  <tr>
     <td><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/images202204250101273.gif"/></td>
     <td><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/Kapture%202025-07-09%20at%2000.53.05.gif"/></td>
  </tr>
</table>

### 网页壁纸

可以将任意网页设置为桌面壁纸，支持在线网址和本地 HTML 文件。

- **在线网址**：支持直接输入 URL。
  - 例如：`https://wangrongding.github.io/jellyfish/`
  - 输入 `google.com`、`localhost:3000` 这类地址时会自动补全协议。
- **本地文件**：支持选择或拖拽本地 `HTML/HTM/SVG` 文件。
  - macOS/Linux 示例：`/Users/your-name/Coding/jellyfish/index.html`
  - Windows 示例：`C:\Users\your-name\Coding\jellyfish\index.html`

### AI 壁纸

支持直接通过提示词生成壁纸。

- AI 配置入口在 `AI 壁纸` 页面里，不在全局设置页
- 生成结果会自动保存到 `~/wallpaper-box`
- 生成完成后可直接设为壁纸或打开所在位置

<img width="1441" height="900" alt="image" src="https://github.com/user-attachments/assets/cf239b2a-e9c7-4a59-9ec0-9c36689af1a6" />

当前已经适配两类常见接法：

- OpenAI Images API 兼容接口
- 智谱 `glm-image`

推荐配置示例：

- OpenAI
  - `API Base URL`: `https://api.openai.com/v1`
  - `Model`: `gpt-image-1`
- 智谱 BigModel
  - `API Base URL`: `https://open.bigmodel.cn/api/paas/v4`
  - `Model`: `glm-image`

说明：

- 如果你填的是智谱完整地址 `https://open.bigmodel.cn/api/paas/v4/images/generations`，当前版本也能兼容
- `glm-image` 支持自定义宽高
- 自定义宽高限制是：`512-2048`，且宽高都必须是 `32` 的整数倍

提示词建议：

- 推荐按这个结构来写：`主体场景 + 风格质感 + 光线时间 + 镜头构图 + 壁纸要求`
- 例如：`未来海岸线城市，黄昏逆光，电影感广角构图，干净留白，适合作为宽屏桌面壁纸，无人物无文字无水印`

### RunCat

托盘图标会根据 CPU 使用情况动态切换速度，支持在托盘菜单和独立的“动态图标”页面里切换不同动画主题。

<table>
  <tr>
     <td width="50%" align="center"><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202212301215445.gif"/></td>
     <td width="50%" align="center"><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301021550728.png"/></td>
  </tr>
</table>

现在不需要再手动改 [electron/tray-list.ts](./electron/tray-list.ts) 了。

- 内置图标会自动扫描 [public/icons](./public/icons) 下的子目录。
- 自定义图标可以在“动态图标”页面里导入、删除一组动画帧，也可以直接把素材放进 `~/wallpaper-box/tray-icons/<你的图标名>/`。
- 同一组动画帧会按文件名顺序播放，适合使用 `001.png`、`002.png` 这类命名。

<img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301030045464.gif" width="600" />

### 设置

当前全局设置页主要保留通用设置：

- 开机自启
- HTTP 代理
- 代理连通性测试
- 壁纸默认存储位置显示, 当前壁纸下载目录默认是 `~/wallpaper-box`

说明：

- 代理测试当前会尝试访问 `Google`
- AI 接口配置不在这里，而是在 `AI 壁纸` 页面里单独设置
- 菜单栏动态图标的预览、切换和自定义导入已经拆分到独立的 `动态图标` 页面

<img width="1000" alt="531b7f4d-270e-4233-8a14-fbc2d4d4c2ff" src="https://github.com/user-attachments/assets/2987e3fa-08f5-4251-bd06-8d0a451d30f7" />

## 开发

### 安装依赖

```sh
yarn install
```

说明：

- `yarn install` 期间会自动执行 `prepare`，把 `yt-dlp / Deno / ffmpeg / ffprobe` 下载到 `resources/bin/`
- 如果这些资源已经存在，就会直接跳过，不会重复下载
- 如果你想手动强制刷新这些二进制，可以执行 `yarn prepare:video-downloader`

### 准备视频下载二进制

如果你想手动强制刷新视频下载相关二进制，可以执行：

```sh
yarn prepare:video-downloader
```

这个脚本会把下面这些二进制下载到 `resources/bin/`：

- `yt-dlp_macos`
- `deno-aarch64-apple-darwin`
- `deno-x86_64-apple-darwin`
- `ffmpeg-darwin-arm64`
- `ffprobe-darwin-arm64`
- `ffmpeg-darwin-x64`
- `ffprobe-darwin-x64`

说明：

- 打包时会通过 `electron-builder.extraResources` 一起带进 `.app`
- `yt-dlp` 遇到分离音视频流时，会自动按当前机器架构选中对应的 `ffmpeg / ffprobe`
- 开发环境也支持通过环境变量覆盖二进制路径：`WALLPAPER_BOX_YT_DLP_PATH`、`WALLPAPER_BOX_DENO_PATH`、`WALLPAPER_BOX_FFMPEG_PATH`、`WALLPAPER_BOX_FFPROBE_PATH`

### 本地开发

同时启动 Web 和 Electron：

```sh
yarn dev
```

分开启动：

```sh
yarn dev:web
yarn dev:electron
```

如果你想基于本地构建结果启动 Electron：

```sh
yarn build:web
yarn build:electron
yarn electron:start
```

### 开发态 Inspect

开发环境下，renderer 已接入基于 Vite 的源码定位能力，在 Electron 开发窗口里也能直接使用。

- 触发方式：在页面上按住 `Option` 后直接点击目标 DOM。
- 命中范围：优先跳到当前项目 `src/` 下最接近你点击位置的源码层级，避免优先命中三方组件内部实现。
- 跳转效果：点击后会直接在本机 IDE 中打开源码并跳转到对应行列。
- 生效环境：只在 `yarn dev` / `yarn dev:web` 这类开发环境生效，生产构建不会注入 inspect 脚本。
- macOS 兜底：开发服务器会优先复用当前已运行的 `VS Code / Cursor / Zed / WebStorm` 的应用可执行路径，减少对 `code` / `cursor` 命令是否安装到 PATH 的依赖。
- 编辑器选择：默认复用 Vite 的 launch-editor 机制自动探测当前编辑器；如果需要显式指定，可以在启动前设置 `LAUNCH_EDITOR`，例如 `LAUNCH_EDITOR=cursor yarn dev` 或 `LAUNCH_EDITOR=code yarn dev`。

## 打包

构建产物默认输出到 `out/` 目录。

架构说明：

- `universal`：一个包同时包含 `Intel(x64)` 和 `Apple Silicon(arm64)` 两种架构。
- 如果你不确定对方的 Mac 是哪种芯片，优先发 `universal`。
- `x64`：给 Intel Mac 用。
- `arm64`：给 Apple Silicon 机器用，比如 `M1 / M2 / M3 / M4`。

```sh
# 默认打包推荐版本：
# 一个包同时支持 Intel Mac 和 Apple Silicon Mac
yarn build

# 显式打包 universal 版本
# 适合发给大多数用户，不用区分芯片型号
yarn build:mac:universal

# 单独打包 Intel Mac 版本
# 适合老款 Mac 或明确知道对方是 Intel 芯片
yarn build:mac:x64

# 单独打包 Apple Silicon 版本
# 适合 M1 / M2 / M3 / M4 等 Apple 芯片设备
yarn build:mac:arm64

# 构建 dmg 安装包
# 默认也是 universal 版本
yarn build:dmg

# 构建 zip 压缩包
# 默认也是 universal 版本
yarn build:zip
```

## 常见问题

### 1. macOS 提示无法打开应用

因为应用没有做 Apple 开发者签名，macOS 可能会拦截首次打开。可以按下面方式放行：

打开终端：

```sh
sudo spctl  --master-disable
sudo xattr -r -d com.apple.quarantine /Applications/wallpaper-box.app
```

如果你的应用不在 `/Applications`，请把命令里的路径替换成实际 `.app` 路径（打开 “访达”（Finder）进入 “应用程序” 目录，找到 wallpaper-box，拖进终端）。

### 2. 老款 Mac 提示“不支持此应用程序”

如果看到类似“这台 Mac 不支持此应用程序”的提示，请先确认两件事：

- 你的系统版本是否低于 `macOS 10.13`
- 你拿到的是不是错误架构的包

建议优先使用默认的 `universal` 包；如果需要单独发包，可以分别构建 `x64` 和 `arm64` 版本。

### 3. AI 生成时报 `404 not found`

如果你接的是智谱 BigModel，当前版本既兼容：

- `https://open.bigmodel.cn/api/paas/v4`
- `https://open.bigmodel.cn/api/paas/v4/images/generations`

如果仍然报错，优先检查：

- `API Key`
- `Model` 是否填成了 `glm-image`
- `API Base URL` 是否有明显拼写错误

### 4. AI 自定义宽高报错

当前 `glm-image` 的自定义宽高限制是：

- 范围必须在 `512-2048`
- 宽和高都必须是 `32` 的整数倍

例如这些是合法的：

- `2048x1152`
- `2048x1280`
- `1792x1024`

## 目录提示

- 静态壁纸、AI 壁纸默认保存目录：`~/wallpaper-box`
- AI 配置入口：`AI 壁纸` 页面右上角 `设置`

## 最后

如果你觉得这个项目还不错，点个 star ⭐️ 支持一下 ~ 谢谢 🌸
