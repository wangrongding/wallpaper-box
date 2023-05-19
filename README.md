<p align="center">
  <a href="https://vuejs.org" target="_blank" rel="noopener noreferrer">
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

<table>
  <tr>
     <td><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301021543565.png"/></td>
     <td><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301021752830.gif"/></td>
  </tr>
</table>

### 动态壁纸

目前支持视频作为动态壁纸，正在开发：自定义页面壁纸和自定义动效壁纸

<table>
  <tr>
      <td width="50%" align="center"><b>Windows 中的效果：</b></td>
      <td width="50%" align="center"><b>MacOS 中的效果：</b></td>
  </tr>
  <tr>
     <td><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/images202204250101273.gif"/></td>
     <td><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301030031627.gif"/></td>
  </tr>
</table>

### RunCat

由于 RunCat 更换高级的猫猫要收费，所以就在这个软件中加一个类似的功能。

通过图标的变换速度，来动态表示 cpu 的使用情况。

可以在托盘菜单中切换动态图标。

<table>
  <tr>
     <td><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202212301215445.gif"/></td>
     <td><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301021550728.png"/></td>
  </tr>
</table>

可爱的超级马里奥~

过几天弄下自定义动态图标。 直接选取本地准备好的帧动画相关的图片，然后就可以自定义动态图标了。（目前你可以使用这几款内置的图标，或者你也可以在 [icons 文件夹](./public/icons) 中添加你的图标，[修改 tray 配置文件](./electron/tray-list.ts) 即可）

<img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301030045464.gif" width="600" />

支持设置开机自启 ,支持设置网络代理

<img width="600" alt="image" src="https://github.com/wangrongding/wallpaper-box/assets/42437658/91b0d5ac-eecc-4061-b630-3b0e2bef4744">

## 常见问题

### 1.无法打开应用程序

因为作者不想花钱做数字签名 🥲，一年的费用好高(这个项目做着玩的，没有收益 👀)，所以你需要按照如下方式安装

打开终端：

```sh
# 命令一
sudo spctl  --master-disable
# 命令二
sudo xattr -r -d com.apple.quarantine <这里是一个空格> <打开 “访达”（Finder）进入 “应用程序” 目录，找到 wallpaper-box，拖进终端>

# 然后回车
```

具体的步骤可以参考：[👉🏻 解决方案](https://zhuanlan.zhihu.com/p/135948430)

如果你对技术非常热爱，很希望和你成为朋友，可以和我们一起交流技术一起变强。

<table>
  <tr>
     <td><img src="https://assets.fedtop.com/picbed/202302090947704.png"/></td>
     <td><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202305190931902.png"/></td>
  </tr>
</table>

## 开发

### 安装依赖 Install dependencies

```sh
yarn i
```

### 开发预览 Developer Preview

直接运行下面的命令，即可启动客户端项目。

```sh
yarn dev

```

如果你想要分别调试 web 和 electron 端，可以使用下面的命令：

```sh
# 只启动 web 服务
yarn dev:web
# 只调试 electron
yarn dev:electron
# or
yarn electron:dev
```

### 打包 Build

构建后的产物在 out 文件夹中。

```sh
# 打包
yarn make
```

## 最后

如果你觉得这个项目还不错，点个 star ⭐️ 支持一下 ~ 谢谢 🌸
