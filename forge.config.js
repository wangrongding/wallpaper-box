module.exports = {
  packagerConfig: {},
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    // {
    //   name: '@electron-forge/maker-dmg',
    //   config: {
    //     name: '壁纸盒子', //可以是中文，但只是安装包名称。
    //     // icon: './icon.icns',
    //     // background: './share_parent_bg_blue.png',
    //   },
    // },
    // ======================
    // {
    //   name: '@electron-forge/maker-deb',
    //   config: {},
    // },
    // {
    //   name: '@electron-forge/maker-rpm',
    //   config: {},
    // },
    // {
    //   name: '@electron-forge/maker-squirrel',
    //   config: {},
    // },
  ],
}
