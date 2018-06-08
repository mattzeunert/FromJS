let currentBabelFilePath = null;

// this is super unclean!! but there's no other type of context I can use in babel helpers right now
// it should be fine since babel transform is synchronous, only one file can be compiled
// by babel at any given time
export function getCurrentBabelFilePath() {
  return currentBabelFilePath;
}

export default function getBabelOptions(plugin, extraBabelOptions = {}, url) {
  currentBabelFilePath = url;

  const options = {
    plugins: [plugin],
    ...extraBabelOptions,
    sourceMaps: true,
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
