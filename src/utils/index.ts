/**
 * 在本地进行文件保存
 * @param {String} data 要保存到本地的图片数据
 * @param {String} filename 文件名
 */
export function saveFile(data: any, filename: string, cors: boolean = false) {
  if (cors) {
    // 同源
    const save_link = document.createElementNS(
      "http://www.w3.org/1999/xhtml",
      "a",
    ) as HTMLAnchorElement;
    save_link.href = data;
    save_link.download = filename;
    const event = document.createEvent("MouseEvents");
    event.initMouseEvent(
      "click",
      true,
      false,
      window,
      0,
      0,
      0,
      0,
      0,
      false,
      false,
      false,
      false,
      0,
      null,
    );
    save_link.dispatchEvent(event);
  } else {
    //不同源
    const x = new window.XMLHttpRequest();
    x.open("GET", data, true);
    x.responseType = "blob";
    x.onload = () => {
      const url = window.URL.createObjectURL(x.response);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
    };
    x.send();
  }
}
