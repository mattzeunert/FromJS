window.onFromJSReady = function(){
    window.fromJSInitialPageHtml = pageHtml;
    var bodyContent = pageHtml.split(/<body.*?>/)[1].split("</body>")[0]
    var headContent = pageHtml.split(/<head.*?>/)[1].split("</head>")[0]    

    var h = getHtmlAndScriptTags(headContent);
    document.head.innerHTML = h.html
    appendScriptsOneAfterAnother(h.scripts, document.head, function(){
        var b = getHtmlAndScriptTags(bodyContent)
        bodyContent = b.html

        var fromJSButton = document.querySelector(".fromjs-show-inspector-button")
        document.body.innerHTML = bodyContent
        if (fromJSButton) {
            document.body.appendChild(fromJSButton)
        }
        makeSureInitialHTMLHasBeenProcessed()
        appendScriptsOneAfterAnother(b.scripts, document.body, function(){})
    })
}

function getHtmlAndScriptTags(html){
    var scripts = []
    html = html.replace(/(\<script).*?\>[\s\S]*?\<\/script\>/g, function(match){
        var script = document.createElement("script")
        if (match.indexOf("></script>") !== -1) {
            script.src = match.match(/\<script.*src=['"](.*?)['"]/)[1]
        } else {
            if (match.match(/\<script.*type=['"](.*?)['"]/) !== null){
                script.setAttribute("type", match.match(/\<script.*type=['"](.*?)['"]/)[1])
            }
            if (match.match(/\<script.*id=['"](.*?)['"]/) !==null){
                script.setAttribute("id", match.match(/\<script.*id=['"](.*?)['"]/)[1])
            }
            var content = match.match(/<script.*?>([\s\S]*)</)[1]
            var type = script.getAttribute("type")
            var contentIsJs = type === null || type === "text/javascript"
            debugger
            if (contentIsJs) {
                // FromJS will call processJavaScript code in this case
                script.text = content
            } else {
                nativeHTMLScriptElementTextDescriptor.set.apply(script, [content])    
            }
            
        }
        scripts.push(script)
        return match; // ... not really a replace
    })
    return {
        html: html,
        scripts: scripts
    }

}

function appendScriptsOneAfterAnother(scripts, container, done){
    next()
    function next(){
        if (scripts.length === 0) {
            done();
            return
        }
        var script = scripts.shift()
        if (script.innerHTML.toString() === ""){
            script.onload = function(){
                console.log("onload")
                next();
            }
        } else {
            next();
        }

        container.appendChild(script)
    }
}


