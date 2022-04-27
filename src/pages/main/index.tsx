import styles from "./index.less";
import { history } from "umi";
import { message, Image } from "antd";
import { Menu, MenuProps, Checkbox } from "antd";
import { getWallHavenAssets } from "@/api/index";
import React, { useState } from "react";
const items: MenuProps["items"] = [
  { key: "1", label: "图片壁纸" },
  { key: "2", label: "视频壁纸" },
];
const levelList = [
  { label: "Apple", value: "Apple" },
  { label: "Pear", value: "Pear" },
  { label: "Orange", value: "Orange" },
];
const typeList = [
  { label: "Apple", value: "Apple" },
  { label: "Pear", value: "Pear" },
  { label: "Orange", value: "Orange" },
];

export default class IndexPage extends React.Component {
  state = {
    wallpaperList: [] as any,
  };

  menuClick = () => {
    message.info(`click`);
  };

  chooseWallPaper = (item: any) => {
    message.info(`click`);
  };

  onLevelChange = (checkedValues: any) => {
    console.log("checked = ", checkedValues);
  };

  onTypeChange = (checkedValues: any) => {
    console.log("checked = ", checkedValues);
  };

  getWallpaper = () => {
    getWallHavenAssets().then((res) => {
      const list = res.data;
      console.log("🚀🚀🚀 / list", list);
      this.setState({
        wallpaperList: list,
      });
    });
  };

  handleClick = () => {
    history.push("/test");
  };

  componentDidMount() {
    console.log("componentDidMount");
    this.getWallpaper();
  }

  componentWillUnmount = () => {
    this.setState = () => {
      return;
    };
  };

  render() {
    return (
      <div>
        <Menu
          theme="dark"
          onClick={this.menuClick}
          defaultSelectedKeys={["1"]}
          mode="horizontal"
          items={items}
        />
        <h1 className={styles.title} onClick={this.handleClick}>
          开发中......
        </h1>
        <div className={styles["wallpaper-list"]}>
          {this.state.wallpaperList.map((item: any, index: number) => {
            return (
              <Image
                className={styles["wallpaper-item"]}
                key={index}
                src={item.thumbs.small}
                preview={{
                  src: item.path,
                }}
              />
            );
          })}
        </div>
      </div>
    );
  }
}

// const { ipcRenderer } = window.require("electron");
// function sendMessageToMain() {
//   message.info(`ping`);
//   ipcRenderer.send("asynchronous-message", "ping");
// }
// ipcRenderer.on("asynchronous-reply", (event: any, arg: string) => {
//   console.log(event, arg); // prints "pong"
// });
