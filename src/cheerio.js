// Loading cheerio accidentally adds lodash to window object
var root = typeof window === "undefined" ? {} : window
var old_ = root._
var cheerio = require("cheerio")
root._ = old_

module.exports = cheerio;
