function waitForEl(cssSelector){
     return browser.driver.wait(function(){
        console.log("Looking for ", cssSelector);
        return browser.driver.isElementPresent(by.css(cssSelector)).then(function(el){
            return el === true;
        });
    })
}

function expectResult(inspectedChar, action){
    var searchChar = element(by.css("[data-test-marker-inspected-value] .fromjs-highlighted-character")).getText()
    expect(searchChar).toBe(inspectedChar)

    var el = element(by.css(".fromjs-origin-path-step"))
    var action = el.element(by.css("[data-test-marker-step-action]")).getText()
    var resultChar = el.element(by.css(".fromjs-highlighted-character")).getText()

    expect(action).toBe(action)
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

describe('Backbone TodoMVC', function() {
    it('Correctly traces a checkbox input', function() {
        loadPage('http://localhost:7500/demos/index.html')
        .then(function(){
            browser.driver.findElement(by.css('.new-todo')).sendKeys('Jane');
            browser.driver.findElement(by.css('.new-todo')).sendKeys(protractor.Key.ENTER);

            return waitForEl('input[type="checkbox"]')
        })
        .then(openFromJSInspector)
        .then(function(){
            element(by.css('input[type="checkbox"]')).click();
            return waitForEl('.fromjs-origin-path-step')
        })
        .then(function(){
            expectResult("i", "Initial Page HTML")
        })
    });
});
