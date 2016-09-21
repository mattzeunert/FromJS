var helpers = require("./helpers")

describe('React TodoMVC', function() {
    it("Loads the app and creates a new todo item", function(){
        helpers.loadPage('http://localhost:9999/react-compiled/index.html#/')
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
            helpers.expectResult("i", "String Literal")
        })
    });

    it("Correctly traces the value of an already existing todo item", function(){
        helpers.inspectElement('.todo-list li label')
        .then(function(){
            helpers.expectResult("H", "localStorage.getItem")
        })
    })

    it("Correctly traces the value of an already existing todo item", function(){
        helpers.inspectElement('.todo-list li:last-child label')
        .then(function(){
            helpers.expectResult("H", "HTMLInputElement Value")
        })
    })
});
