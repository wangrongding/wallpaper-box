import styles from "./index.less";
import { history } from "umi";
import { ConfigProvider, DatePicker, message } from "antd";
import { Menu, MenuProps } from "antd";
const items: MenuProps["items"] = [
  {
    label: "视频",
    key: "1",
  },
  {
    label: "图片",
    key: "2",
  },
];
const menuClick = () => {
  message.info(`click`);
};

const chooseWallPaper = (item) => {
  message.info(`click`);
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
      <h1 className={styles.title}>主界面开发中......</h1>
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
