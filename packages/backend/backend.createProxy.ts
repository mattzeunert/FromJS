import { BackendOptions } from "./BackendOptions";

export interface CreateProxyWrapperArgs {
  accessToken: string;
  options: BackendOptions;
}

/* Start proxy in a child process and enable communication */
export function createProxy(params: CreateProxyWrapperArgs) {
  return new Promise(resolve => {
    const fork = require("child_process").fork;

    // If debugging parent process allow debuggign child process as well
    if (process.execArgv.join(",").includes("--inspect")) {
      process.execArgv.push("--inspect=" + 9223);
    }

    const child = fork(__dirname + "/backend.proxy.js", [
      JSON.stringify(params)
    ]);

    const proxyInterface = {};
    ["registerEvalScript", "instrumentForEval"].forEach(method => {
      proxyInterface[method] = function() {
        child.send({
          method,
          arguments
        });
      };
    });

    child.on("message", function(message) {
      if (message.type === "isReady") {
        resolve(proxyInterface);
        console.log("ready");
      }
      console.log("got message from proxy process", arguments);
    });
  });
}