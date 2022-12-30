# wallpaper-hub (WIP)

一个桌面壁纸客户端，支持动态壁纸。

技术栈：`React生态` + `Electron` + `TypeScript` + `Vite`。

## RunCat

由于 RunCat 更换高级的猫猫要收费，所以就在这个软件中加一个类似的功能。

通过图标的变换速度，来动态表示 cpu 的使用情况。

<img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202212301215445.gif" width="600" />  
<img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202212300236138.gif" width="600" />

## 壁纸列表

壁纸来源于 wallhaven.cc ，最喜欢的一个壁纸网站。

<img src="https://raw.githubusercontent.com/wangrongding/image-house/master/images202204280233745.png" width="600" />

## 动态壁纸效果

功能还在完善中 ~

<img src="https://raw.githubusercontent.com/wangrongding/image-house/master/images202204250101273.gif" width="600" />

## 开发

### 安装依赖 Install dependencies

```sh
pnpm i
```

### 开发预览 Developer Preview

```sh
# 直接运行
pnpm dev
# 只调试 web 端
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
# 打包 web 端
```

## 最后

如果你觉得这个项目还不错，点个 star ⭐️ 支持一下 ~ 谢谢 🌸
