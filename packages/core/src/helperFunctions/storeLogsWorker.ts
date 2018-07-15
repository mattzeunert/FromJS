export function getStoreLogsWorker({ postToBE, accessToken }) {
  const environmentSupportsWorker = typeof Worker !== "undefined";
  if (!environmentSupportsWorker) {
    return null;
  }

  function workerCode() {
    self["perfStats"] = {
      totalLogCount: 0,
      logDataBytesSent: 0
    };
    onmessage = function(e) {
      // note: console.log instead of consoleLog is fine here because we're inside the web worker
      // which doesn't contain inspected page code overwriting console.log
      if (e.data.logs) {
        self["perfStats"].totalLogCount += e.data.logs.length;
        postToBE("/storeLogs", e.data, function({ bodyLength, stringifyTime }) {
          console.log(
            "Saving logs: ",
            e.data.logs.length,
            "Size: ",
            bodyLength / 1024 / 1024,
            "Mb",
            "Stringify took " + stringifyTime + "ms"
          );
          self["perfStats"].logDataBytesSent += bodyLength;
        });
      } else if (e.data.showDoneMessage) {
        const perfInfo = self["perfStats"];
        console.log("DONE", {
          totalLogCount: perfInfo.totalLogCount / 1000 + "k",
          logDataSent: perfInfo.logDataBytesSent / 1024 / 1024 + "mb"
        });
      }
    };
  }
  return new Worker(
    URL.createObjectURL(
      new Blob([
        postToBE +
          ";var accessToken = '" +
          accessToken +
          "'" +
          ";(" +
          workerCode +
          ")()"
      ])
    )
  );
}
