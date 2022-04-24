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

export default function IndexPage() {
  return (
    <div>
      <h1 className={styles.title} onClick={sendMessageToMain}>
        Page index
      </h1>
    </div>
  );
}
