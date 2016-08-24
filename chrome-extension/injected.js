import {getJSScriptTags} from "../src/getJSScriptTags"

function getScriptElements(html){
    return getJSScriptTags(html).map(function(tag){
        var wrapper = originalCreateElement.call(document, "div")
        nativeInnerHTMLDescriptor.set.call(wrapper, tag.completeTag) // we want to keep any script attributes
        wrapper.text = tag.content // re-assign so fromjs transforms it on assignment

        // I think the script doesn't get loaded / executed when the scriptEl
        // isn't created with createElement
        var scriptEl = originalCreateElement.call(document, "script");
        [].slice.apply(wrapper.children[0].attributes).forEach(function(attr){
            scriptEl.setAttribute(attr.name, attr.textContent)
        })
        if (tag.content !== "") {
            scriptEl.text = tag.content // assignment will be processed by fromjs
        }
        return scriptEl
    })
}

window.onFromJSReady = function(){
    window.fromJSInitialPageHtml = pageHtml;
    var bodyContent = pageHtml.split(/<body.*?>/)[1].split("</body>")[0]
    var headContent = pageHtml.split(/<head.*?>/)[1].split("</head>")[0]

    var headScripts = getScriptElements(headContent);
    var bodyScripts = getScriptElements(bodyContent);
    document.head.innerHTML = headContent
    appendScriptsOneAfterAnother(headScripts, document.head, function(){
        document.body.innerHTML = bodyContent
        makeSureInitialHTMLHasBeenProcessed()
        appendScriptsOneAfterAnother(bodyScripts, document.body, function(){
            simulateOnLoad()
        })
    })
}

function simulateOnLoad(){
    if (document.body.onload) {
        document.body.onload({});
    }

    // I can't override document.readyState, so it will always be "complete" and never "loading"
    document.dispatchEvent(new Event("readystatechange"))
}



function appendScriptsOneAfterAnother(scripts, container, done){
    next()
    function next(){
        if (scripts.length === 0) {
            done();
            return
        }
        var script = scripts.shift()
        console.log("Adding", script)
        if (nativeInnerHTMLDescriptor.get.call(script) === ""){
            script.onload = function(){
                next();
            }
            container.appendChild(script)
        } else {
            container.appendChild(script)
            next();
        }
    }
}
