import { AddressInfo } from "net";
import { ViteDevServer } from "vite";
export let electronDev = () => {
  return {
    name: "vite-plugin-electron-dev",
    configureServer(server: ViteDevServer) {
      require("esbuild").buildSync({
        entryPoints: ["./src/electron/main.ts"],
        bundle: true,
        platform: "node",
        outfile: "./electron/main.js",
        external: ["electron"],
      });
      const httpServer = server.httpServer!;
      httpServer.once("listening", () => {
        let { spawn } = require("child_process");
        let addressInfo = httpServer.address()! as AddressInfo;
        // let httpAddress = `http://${addressInfo.address}:${addressInfo.port}`;
        let httpAddress = `http://localhost:${addressInfo.port}`;
        console.log("🚀🚀🚀 / httpAddress", httpAddress);
        let electronProcess = spawn(
          require("electron").toString(),
          ["./electron/main.js", httpAddress],
          {
            cwd: process.cwd(),
            stdio: "inherit",
          }
        );
        electronProcess.on("close", () => {
          // if (electronProcess && electronProcess.kill) {
          //   process.kill(electronProcess.pid);
          //   electronProcess = null;
          // }
          server.close();
          process.exit();
        });
      });
    },
  };
};
