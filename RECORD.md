# 记录

## 安装 electron 失败的解决方案

```sh
pnpm add electron -D
```

一些时候会得到以下错误，主要是该死的 GFW 导致的。

![](https://assets.fedtop.com/picbed/202212261135630.png)

解决方案：使用淘宝镜像

```sh
npm config set registry https://registry.npmmirror.com
npm config set electron_mirror https://cdn.npmmirror.com/binaries/electron/
npm config set electron_builder_binaries_mirror https://npmmirror.com/mirrors/electron-builder-binaries/
```

或者直接使用下面的命令，通过 vim 修改配置文件

```sh
npm config edit
```

在空白处将下面几个配置添加上去,注意如果有原有的这几项配置，就修改

```sh
registry=https://registry.npmmirror.com
electron_mirror=https://cdn.npmmirror.com/binaries/electron/
electron_builder_binaries_mirror=https://npmmirror.com/mirrors/electron-builder-binaries/
```

修改完成后，再次执行安装命令

![](https://assets.fedtop.com/picbed/202212261144037.png)

可以看到就成功了。

> https://www.cnblogs.com/makalochen/p/16154510.html
> https://www.electronjs.org/zh/docs/latest/tutorial/installation
