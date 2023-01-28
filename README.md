<p align="center">
  <a href="https://vuejs.org" target="_blank" rel="noopener noreferrer">
    <img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301021532343.svg" width="300" alt="wallpaper-box logo"/>
  </a>
</p>

一个桌面壁纸客户端，支持动态壁纸。

支持的功能：

- [x] 壁纸列表
- [x] 下载壁纸
- [x] 设置静态壁纸
- [x] 设置动态壁纸（在 MacOs 中，全屏动态壁纸，并没有完全覆盖整块屏幕，欢迎知道如何处理的小伙伴提 PR）
- [x] RunCat 动态托盘图标，根据 CPU 使用情况改变切换速度
- [x] 支持修改代理
- [ ] 网页 url 壁纸（指定一个网页成为桌面壁纸）
- [ ] 支持用户自己手写 Threejs 动画壁纸

## 使用

### 壁纸列表

壁纸来源于 wallhaven.cc ，最喜欢的一个壁纸网站。

可以直接设置成桌面壁纸，也可以下载到本地或者预览。

<img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301021543565.png" width="600" />

鼠标左键预览大图，鼠标右键可以设置为桌面壁纸。

<img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301021752830.gif" width="600" />

### 动态壁纸

MacOS 中的效果：

<img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301030031627.gif" width="600" />

Windows 中的效果：

<img src="https://raw.githubusercontent.com/wangrongding/image-house/master/images202204250101273.gif" width="600" />

### RunCat

由于 RunCat 更换高级的猫猫要收费，所以就在这个软件中加一个类似的功能。

通过图标的变换速度，来动态表示 cpu 的使用情况。

<img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202212301215445.gif" width="600" />

可以在托盘菜单中切换动态图标。  
<img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301021550728.png" width="600" />

可爱的超级马里奥~

过几天弄下自定义动态图标。 直接选取本地准备好的帧动画相关的图片，然后就可以自定义动态图标了。（目前你可以使用这几款内置的图标，或者你也可以在 [icons 文件夹](./public/icons) 中添加你的图标，[修改 tray 配置文件](./electron/tray-list.ts) 即可）

<img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301030045464.gif" width="600" />

<!-- <img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202212300236138.gif" width="600" /> -->

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
