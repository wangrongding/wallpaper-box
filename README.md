# wallpaper-box (WIP)

一个桌面壁纸客户端，支持动态壁纸。

技术栈：`React生态` + `Electron` + `TypeScript` + `Vite`。

## 目前的功能

### RunCat

由于 RunCat 更换高级的猫猫要收费，所以就在这个软件中加一个类似的功能。

通过图标的变换速度，来动态表示 cpu 的使用情况。

<img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202212301215445.gif" width="600" />

<img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202212300236138.gif" width="600" />

### 壁纸列表

壁纸来源于 wallhaven.cc ，最喜欢的一个壁纸网站。

可以直接设置成桌面壁纸，也可以下载到本地或者预览。

<img src="https://raw.githubusercontent.com/wangrongding/image-house/master/images202204280233745.png" width="600" />

### 动态壁纸

动态壁纸功能还在完善中 ~

windows 下可以用，mac 下还有点问题 😅。

<img src="https://raw.githubusercontent.com/wangrongding/image-house/master/images202204250101273.gif" width="600" />

## 开发

### 安装依赖 Install dependencies

```sh
pnpm i
```

### 开发预览 Developer Preview

直接运行下面的命令，即可启动客户端项目。

```sh
pnpm dev

```

如果你想要分别调试 web 和 electron 端，可以使用下面的命令：

```sh
# 启动 web 服务
pnpm dev:web
# 调试 electron 端
pnpm dev:electron
# 分别调试 web 和 electron 端
pnpm dev:split
```

### 打包 Build

```sh
# 打包
pnpm build
```

## 最后

如果你觉得这个项目还不错，点个 star ⭐️ 支持一下 ~ 谢谢 🌸
