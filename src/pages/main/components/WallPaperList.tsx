import styles from "./index.less";
import { message, Image, Button } from "antd";
import { Menu, MenuProps, Checkbox, Switch, Spin } from "antd";
import { saveFile } from "@/utils/index";
import { getWallHavenAssets } from "@/api/index";
import React, { useState, useEffect } from "react";
import _, { debounce } from "lodash";
const levelOptions = [
  { label: "Apple", value: "1" },
  { label: "Pear", value: "2" },
  { label: "Orange", value: "3" },
];
const typeOptions = [
  { label: "Apple", value: "1" },
  { label: "Pear", value: "1" },
  { label: "Orange", value: "1" },
];
const sortOptions = [
  { label: "Apple", value: "1" },
  { label: "Pear", value: "1" },
  { label: "Orange", value: "1" },
];

const WallPaperList: React.FC = () => {
  const scrollRef = React.createRef<HTMLDivElement>();
  const [state, setState] = useState({
    loading: false,
    wallpaperList: [] as any,
    query: {
      page: 1,
      purity: "000",
      categories: "000",
    },
  });

  const chooseWallPaper = (item: any) => {
    console.log(item.path);
    saveFile(item.path, item.id);
  };

  const onLevelChange = (checkedValues: any) => {
    console.log("checked = ", checkedValues);
  };

  const onTypeChange = (checkedValues: any) => {
    console.log("checked = ", checkedValues);
  };
  // 滚动加载更多
  const onScroll = _.debounce(() => {
    if (state.loading) return;
    let clientHeight = scrollRef.current!.clientHeight; //可视区域高度
    let scrollTop = scrollRef.current!.scrollTop; //滚动条滚动高度
    let scrollHeight = scrollRef.current!.scrollHeight; //滚动内容高度
    if (clientHeight + scrollTop + 200 > scrollHeight) {
      getWallpaper();
    }
  }, 1000);
  // 获取壁纸
  const getWallpaper = () => {
    setState((prevState) => {
      return {
        ...prevState,
        loading: true,
        query: Object.assign(prevState.query, {
          purity: "100",
          categories: "100",
        }),
      };
    });
    console.log(state.query);
    getWallHavenAssets(state.query).then((res) => {
      const list = res.data;
      setState((prevState) => {
        return {
          ...prevState,
          loading: false,
          wallpaperList: [...prevState.wallpaperList, ...list],
          query:
            list.length &&
            Object.assign(prevState.query, {
              page: prevState.query.page + 1,
            }),
        };
      });
    });
  };

  useEffect(() => {
    console.log("useEffect");
    getWallpaper();
  }, []);
  return (
    <div className={styles.main}>
      <div className={styles.operation}>
        <div style={{ display: "inline-block", float: "left", margin: " 0 20px " }}>
          <Switch
            checkedChildren="人物"
            unCheckedChildren="人物"
            onChange={onLevelChange}
            defaultChecked
          />
        </div>
        部分功能开发中......
      </div>
      <div className={styles["wallpaper-list"]} onScroll={onScroll} ref={scrollRef}>
        {state.wallpaperList.map((item: any, index: number) => {
          return (
            <Image
              onContextMenu={() => {
                chooseWallPaper(item);
              }}
              className={styles["wallpaper-item"]}
              key={index}
              src={item.thumbs.small}
              preview={{
                src: item.path,
              }}
            />
          );
        })}
        <Spin style={{ gridColumn: "1 / 6" }} size="large" />
      </div>
    </div>
  );
};

export default WallPaperList;
