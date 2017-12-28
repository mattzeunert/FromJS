var helpers = require("./helpers")


describe('Page using Babel Polyfill', function() {
    it("Loads the page", function(){
        helpers.loadPage('http://localhost:9999/demos/babel-polyfill/index.html')
        .then(function(){
            return helpers.waitForEl('#js-div')
        })
        .then(helpers.openFromJSInspector)
    })

    // The main test here is that running babel polyfill code doesn't break
    it('Can find the string ', function() {
        helpers.inspectElement('#js-div')
        .then(function(){
            helpers.expectResult("a", "String Literal")
        })
    });
});
