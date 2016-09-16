var helpers = require("./helpers")

describe('Backbone TodoMVC', function() {
    it("Loads the app and creates a new todo item", function(){
        helpers.loadPage('http://localhost:9999/demos/index.html')
        .then(function(){
            browser.driver.findElement(by.css('.new-todo')).sendKeys('Hello');
            browser.driver.findElement(by.css('.new-todo')).sendKeys(protractor.Key.ENTER);

            return helpers.waitForEl('input[type="checkbox"]')
        })
        .then(helpers.openFromJSInspector)
    })

    it('Correctly traces a checkbox input', function() {
        helpers.inspectElement('input[type="checkbox"]')
        .then(function(){
            helpers.expectResult("i", "Initial Page HTML")
        })
    });

    it("Correctly traces the value of a newly created todo item", function(){
        helpers.inspectElement('.todo-list li label')
        .then(function(){
            helpers.expectResult("H", "HTMLInputElement Value")
        })
    })

    it("Provides a button to inspect the parent element of the current selection", function(){
        helpers.inspectParentElement()
        .then(function(){
            helpers.expectResult("<", "Initial Page HTML")
        })
    })
});
