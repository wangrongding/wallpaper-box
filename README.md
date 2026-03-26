<p align="center">
  <a href="https://vuejs.org" target="_blank" rel="noopener noreferrer">
    <img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301021532343.svg" width="300" alt="wallpaper-box logo"/>
  </a>
</p>

🏞️ `wallpaper-box` 是一个基于 Electron 的桌面壁纸客户端，支持静态壁纸、视频壁纸、网页壁纸，并集成了类似 RunCat 的动态托盘图标能力。

## 功能

- [x] 浏览和搜索在线壁纸
- [x] 下载壁纸到本地
- [x] 设置静态壁纸
- [x] 设置视频壁纸（在 MacOs 中，全屏动态壁纸，并没有完全覆盖整块屏幕，欢迎知道如何处理的小伙伴提 PR）
- [x] 设置网页壁纸
- [x] 支持在线 URL 和本地 HTML 文件作为网页壁纸
- [x] RunCat 动态托盘图标，根据 CPU 使用情况改变切换速度
- [x] 支持开机自启
- [x] 支持 HTTP 代理配置
- [ ] 支持大模型文生图，用户输入文字描述，创造壁纸

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

目前支持将本地视频文件设置为桌面动态壁纸。

- 支持点击选择或拖拽视频文件。
- 常见格式如 `MP4`、`MOV`、`WebM` 均可尝试。
- macOS 下动态壁纸窗口的铺满效果仍有继续优化空间，欢迎 PR。

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

### RunCat

托盘图标会根据 CPU 使用情况动态切换速度，支持在托盘菜单里切换不同动画主题。

<table>
  <tr>
     <td width="50%" align="center"><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202212301215445.gif"/></td>
     <td width="50%" align="center"><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301021550728.png"/></td>
  </tr>
</table>

如果你想添加自定义图标，可以直接往 [public/icons](/Users/rongding/Coding/wallpaper-box/public/icons) 里补素材，并在 [electron/tray-list.ts](/Users/rongding/Coding/wallpaper-box/electron/tray-list.ts) 里注册。

<img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301030045464.gif" width="600" />

### 设置

- 支持开机自启
- 支持 HTTP 代理
- 代理测试会尝试访问 Google
- 当前壁纸下载目录默认是 `~/wallpaper-box`

<img width="600" alt="image" src="https://github.com/wangrongding/wallpaper-box/assets/42437658/91b0d5ac-eecc-4061-b630-3b0e2bef4744">

## 常见问题

### 1. 无法打开应用程序

因为应用没有做 Apple 开发者签名，macOS 可能会拦截首次打开。可以按下面方式放行：

打开终端：

```sh
sudo spctl  --master-disable
sudo xattr -r -d com.apple.quarantine /Applications/wallpaper-box.app
```

如果你的应用不在 `/Applications`，请把命令里的路径替换成实际 `.app` 路径（打开 “访达”（Finder）进入 “应用程序” 目录，找到 wallpaper-box，拖进终端）。

### 2. 老款 Mac 打不开

如果看到类似“这台 Mac 不支持此应用程序”的提示，请先确认两件事：

- 你的系统版本是否低于 `macOS 10.13`
- 你拿到的是不是错误架构的包

建议优先使用默认的 `universal` 包；如果需要单独发包，可以分别构建 `x64` 和 `arm64` 版本。

## 开发

### 安装依赖

```sh
yarn install
```

### 本地开发

直接运行下面的命令即可同时启动 Web 和 Electron：

```sh
yarn dev
```

如果你想分开调试：

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

### 打包

构建产物默认输出到 `out/` 目录。

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

## 最后

如果你觉得这个项目还不错，点个 star ⭐️ 支持一下 ~ 谢谢 🌸
