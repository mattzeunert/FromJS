export default function getBabelOptions(plugin, extraBabelOptions = {}, url) {
  const options = {
    plugins: [plugin],
    ...extraBabelOptions,
    sourceMaps: true,
    sourceFileName: url + "?dontprocess",
    sourceMapTarget: url + ".map",
    parserOpts: {
      strictMode: false
    },
    // prevent code from not being pretty after instrumentation:
    // `[BABEL] Note: The code generator has deoptimised the styling of "unknown" as it exceeds the max of "500KB"`
    compact: false
  };
  return options;
}
