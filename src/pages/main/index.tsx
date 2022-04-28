import styles from "./index.less";
import { history } from "umi";
import { message, Image } from "antd";
import { Menu, MenuProps, Checkbox, Switch } from "antd";
import React, { useState } from "react";
import WallPaperList from "./components/WallPaperList";
const { ipcRenderer } = window.require("electron");
const items: MenuProps["items"] = [
  { key: "1", label: "图片壁纸" },
  { key: "2", label: "视频壁纸" },
];
const ThemeContext = React.createContext("light");
// 绑定键盘事件
window.addEventListener("keyup", handleKeyPress, true);
function handleKeyPress(event: any) {
  if (event.key === "F12") {
    ipcRenderer.send("open-devtools");
  } else if (event.key === "F5") {
    ipcRenderer.send("refresh-window");
  }
}

const IndexPage: React.FC = () => {
  const [state, setState] = useState({});
  const menuClick = () => {
    message.info(`click`);
  };
  return (
    <div className={styles.layout}>
      <ThemeContext.Provider value="dark">
        <Menu
          theme="dark"
          onClick={menuClick}
          defaultSelectedKeys={["1"]}
          mode="horizontal"
          items={items}
        />
        <WallPaperList />
      </ThemeContext.Provider>
    </div>
  );
};

export default IndexPage;
