let currentBabelFilePath = null;

// this is super unclean!! but there's no other type of context I can use in babel helpers right now
// it should be fine since babel transform is synchronous, only one file can be compiled
// by babel at any given time
export function getCurrentBabelFilePath() {
  return currentBabelFilePath;
}
// more global state for babel
let locs = {};
export function createLoc(value) {
  // would be nice to just use an integer, but then need to avoid collisions better
  const id =
    Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString() +
    Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString();
  locs[id] = value;
  return id;
}
export function getAndResetLocs() {
  var ret = locs;
  locs = {};
  return ret;
}

export default function getBabelOptions(plugin, extraBabelOptions = {}, url) {
  currentBabelFilePath = url;

  const options = {
    plugins: [plugin],
    ...extraBabelOptions,
    sourceMaps: false,
    sourceFileName: url + "?dontprocess",
    parserOpts: {
      strictMode: false
    },
    // prevent code from not being pretty after instrumentation:
    // `[BABEL] Note: The code generator has deoptimised the styling of "unknown" as it exceeds the max of "500KB"`
    compact: false
  };
  return options;
}
