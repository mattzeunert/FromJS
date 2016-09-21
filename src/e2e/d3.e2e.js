var helpers = require("./helpers")

var circleOuterHtml = '<circle r="25" transform="translate(100,50)" fill="rgb(255, 0, 0)"></circle>'

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

    it('Can find where the fill property name was declared', function() {
        var charIndex = circleOuterHtml.indexOf("transform")
        helpers.inspectElement('circle:first-child', charIndex)
        .then(function(){
            helpers.expectResult("t", "String Literal")
        })
    });
});
