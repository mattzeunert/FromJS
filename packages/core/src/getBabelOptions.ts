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
    Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36) +
    Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36);
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
    plugins: [
      // these plugins do replacements and drop the path.node.loc on the way
      // and generally misrepresent the code the user wrote
      // but they do fix some issues for edge cases that FromJS doesn't support directly
      // -----
      // Enabling these probably means inaccurate mapping, and would also require source
      // location mapping for doing stuff like going from a char index in an eval'd script
      // to the script where eval was called
      // so right now I'm generally leaning against supporting these
      // require("@babel/plugin-transform-destructuring"),
      // require("@babel/plugin-transform-computed-properties"),
      plugin
    ],
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
