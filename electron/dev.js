const electron = require("electron");
const path = require("path");
const chokidar = require("chokidar");
const { spawn } = require("child_process");

let electronProcess = null;

const start = () => {
  electronProcess = spawn(electron, [path.join(__dirname, "./main.js")]);
  console.log(path.join(__dirname, "../node_modules/.bin/electron"));
};
start();
// 开发环境下，监听electron目录下的文件变化，重启electron
chokidar.watch(".").on("change", () => {
  console.log("正在重新构建...");
  if (electronProcess && electronProcess.kill) {
    process.kill(electronProcess.pid);
    electronProcess = null;
    start();
  }
});
