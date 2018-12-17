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
      process.execArgv.push("--inspect=" + 19223);
    }

    const child = fork(__dirname + "/backend.proxy.js", [
      JSON.stringify({
        accessToken: params.accessToken,
        bePort: params.options.bePort,
        proxyPort: params.options.proxyPort,
        certDirectory: params.options.getCertDirectory(),
        dontTrack: params.options.dontTrack,
        block: params.options.block,
        disableDefaultBlockList: params.options.disableDefaultBlockList
      })
    ]);

    const messageResponsePromisesResolveFn = {};
    const proxyInterface: any = {};
    [
      "registerEvalScript",
      "instrumentForEval",
      "setEnableInstrumentation",
      "_getEnableInstrumentation"
    ].forEach(method => {
      proxyInterface[method] = function() {
        const messageId = Math.floor(
          Math.random() * Number.MAX_SAFE_INTEGER
        ).toString();
        const promise = new Promise(resolve => {
          messageResponsePromisesResolveFn[messageId] = resolve;
          child.send({
            method,
            arguments,
            messageId
          });
        });
        return promise;
      };
    });

    child.on("message", function(message) {
      if (message.type === "isReady") {
        resolve(proxyInterface);
      }
      if (message.type === "storeLocs") {
        params.storeLocs(message.locs);
      }
      if (message.type === "messageResponse") {
        messageResponsePromisesResolveFn[message.messageId](message.ret);
      }
    });
  });
}
