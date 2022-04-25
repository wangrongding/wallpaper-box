const { session } = require("electron");
// 设置http请求头

function setHttpHeader() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": ["style-src 'self' 'unsafe-inline'"],
      },
    });
  });
}
