module.exports = function instrument(args, done) {
  const { body, url, babelPluginOptions } = args;

  done({
    code: body.replace("Hi", "Hello"),
    map: null
  });
};
