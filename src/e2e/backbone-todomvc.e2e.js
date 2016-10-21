var helpers = require("./helpers")

describe('Backbone TodoMVC', function() {
    it("Loads the app and creates a new todo item", function(){
        helpers.loadPage('http://localhost:9999/demos/backbone-todomvc/index.html')
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
        .then(helpers.inspectParentElement())
        .then(helpers.inspectParentElement())
        .then(helpers.inspectParentElement())
        .then(function(){
            helpers.expectResult("M", "Initial Page HTML")
        })
    })

    it("Lets you inspect origin values along the origin step chain", function(){
        // it seems like you can't click on the footer directly, so click
        // on filter link and navigate up
        helpers.inspectElement('.todoapp a.selected')
        .then(helpers.inspectParentElement())
        .then(helpers.inspectParentElement())
        .then(helpers.inspectParentElement())
        .then(function(){
            helpers.expectResult("1", "Number")

            helpers.switchToIframe();
            element(by.css(".fromjs-origin-path-step:last-child .fromjs-value__content div:nth-child(2) span:nth-child(40)")).click();
            helpers.switchToInspectedPage();

            helpers.waitForHighlightedCharIndex(40 - 1 /*nth child is 1-based, this function is 0 based */)
            .then(function(){
                helpers.expectResult("s", "Initial Page HTML")
            })
        })
    })
});
