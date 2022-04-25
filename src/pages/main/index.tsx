import styles from "./index.less";
import { history } from "umi";
// import { ipcRenderer } from 'electron';
const { ipcRenderer } = window.require("electron");
function sendMessageToMain() {
  ipcRenderer.send("asynchronous-message", "ping");
}
ipcRenderer.on("asynchronous-reply", (event: any, arg: string) => {
  console.log(event, arg); // prints "pong"
});

console.log("🚀🚀🚀 / styles", styles);
const wallpaperList = Array.from({ length: 100 }, (v, i) => i);
console.log("🚀🚀🚀 / wallpaperList", wallpaperList);
export default function IndexPage() {
  return (
    <div>
      <h1 className={styles.title}>主界面开发中......</h1>
      <div className={styles["wallpaper-list"]}>
        {wallpaperList.map((item, index) => {
          return (
            <div className={styles["wallpaper-item"]} key={item} onClick={sendMessageToMain}>
              壁纸{index}
            </div>
          );
        })}
      </div>
    </div>
  );
}
