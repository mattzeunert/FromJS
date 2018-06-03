export default function getBabelOptions(plugin, extraBabelOptions = {}) {
  const options = {
    plugins: [plugin],
    ...extraBabelOptions,
    parserOpts: {
      strictMode: false
    }
  };
  return options;
}
