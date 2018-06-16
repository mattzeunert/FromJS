import { BackendOptions } from "./BackendOptions";

export interface CreateProxyWrapperArgs {
  accessToken: string;
  options: BackendOptions;
  storeLocs: (locs: any[]) => void;
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
      JSON.stringify({
        accessToken: params.accessToken,
        bePort: params.options.bePort,
        proxyPort: params.options.proxyPort,
        certDirectory: params.options.getCertDirectory()
      })
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
      }
      if (message.type === "storeLocs") {
        params.storeLocs(message.locs);
      }
    });
  });
}
