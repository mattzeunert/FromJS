function waitForEl(cssSelector){
     return browser.driver.wait(function(){
        console.log("Looking for ", cssSelector);
        return browser.driver.isElementPresent(by.css(cssSelector)).then(function(el){
            return el === true;
        });
    })
}

function expectResult(inspectedChar, expectedAction){
    var searchChar = element(by.css("[data-test-marker-inspected-value] .fromjs-highlighted-character")).getText()
    expect(searchChar).toBe(inspectedChar)

    var el = element(by.css(".fromjs-origin-path-step"))
    var action = el.element(by.css("[data-test-marker-step-action]")).getText()
    var resultChar = el.element(by.css(".fromjs-highlighted-character")).getText()

    expect(action).toBe(expectedAction)
    expect(resultChar).toBe(inspectedChar)
}

function loadPage(url){
    browser.ignoreSynchronization = true;
    browser.get(url);

    return waitForEl('.fromjs-show-inspector-button')
}

function openFromJSInspector(){
    element(by.css('.fromjs-show-inspector-button')).click();
    return waitForEl("#fromjs")
}

function inspectElement(cssSelector) {
    element(by.css(cssSelector)).click();
    return waitForEl('.fromjs-origin-path-step')
}

describe('Backbone TodoMVC', function() {
    it("Loads the app and creates a new todo item", function(){
        loadPage('http://localhost:7500/demos/index.html')
        .then(function(){
            browser.driver.findElement(by.css('.new-todo')).sendKeys('Hello');
            browser.driver.findElement(by.css('.new-todo')).sendKeys(protractor.Key.ENTER);

            return waitForEl('input[type="checkbox"]')
        })
        .then(openFromJSInspector)
    })
    it('Correctly traces a checkbox input', function() {
        inspectElement('input[type="checkbox"]')
        .then(function(){
            expectResult("i", "Initial Page HTML")
        })
    });

    it("Correctly traces the value of a newly created todo item", function(){
        inspectElement('.todo-list li')
        .then(function(){
            expectResult("H", "HTMLInputElement Value")
        })
    })
});
