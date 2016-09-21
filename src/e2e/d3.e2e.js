var helpers = require("./helpers")

describe('D3 App', function() {
    it("Loads the app", function(){
        helpers.loadPage('http://localhost:9999/demos/d3/index.html')
        .then(function(){
            return helpers.waitForEl('circle')
        })
        .then(helpers.openFromJSInspector)
    })

    it('Can find the string used to create the circle tag', function() {
        helpers.inspectElement('circle:first-child', 1)
        .then(function(){
            helpers.expectResult("c", "String Literal")
        })
    });
});
