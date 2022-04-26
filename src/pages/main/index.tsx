import styles from "./index.less";
import { history } from "umi";
import { ConfigProvider, DatePicker, message } from "antd";
import { Menu, MenuProps } from "antd";
import { getWallHavenAssets } from "@/api/index";
import { useState } from "react";
const items: MenuProps["items"] = [
  {
    key: "1",
    label: "视频壁纸",
  },
  {
    key: "2",
    label: "图片壁纸",
  },
];
const menuClick = () => {
  message.info(`click`);
};

const chooseWallPaper = (item) => {
  message.info(`click`);
};

const getWallpaper = () => {
  getWallHavenAssets().then((res) => {
    const list = res.data;
    console.log(list);
  });
};

// const { ipcRenderer } = window.require("electron");
// function sendMessageToMain() {
//   message.info(`ping`);
//   ipcRenderer.send("asynchronous-message", "ping");
// }
// ipcRenderer.on("asynchronous-reply", (event: any, arg: string) => {
//   console.log(event, arg); // prints "pong"
// });

const wallpaperList = Array.from({ length: 100 }, (v, i) => i);
export default function IndexPage() {
  return (
    <div>
      <Menu onClick={menuClick} mode="horizontal" items={items} />
      <h1 className={styles.title} onClick={getWallpaper}>
        主界面开发中......
      </h1>
      <div className={styles["wallpaper-list"]}>
        {wallpaperList.map((item, index) => {
          return (
            <div className={styles["wallpaper-item"]} key={item}>
              壁纸{index}
            </div>
          );
        })}
      </div>
    </div>
  );
}
