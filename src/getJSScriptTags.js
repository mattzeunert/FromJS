import getOpeningAndClosingTags from "./getOpeningAndClosingTags"
var cheerio = require("cheerio")

function processJSScriptTagsInHtml(html, replace){
    var scriptTags = [];

    html = html.replace(/(\<script).*?\>[\s\S]*?\<\/script\>/g, function(scriptTag){
        var $ = cheerio.load(scriptTag)("*")

        var isJS = !$.attr("type") || $.attr("type") === "text/javascript"
        var isInlineJS = isJS && !$.attr("src");
        var content = $.html()

        var parts = getOpeningAndClosingTags(scriptTag, content)

        if (isInlineJS && replace !== undefined) {
            content = replace(content)
        }

        var completeTag = parts.openingTag + content + parts.closingTag

        if (isJS) {
            scriptTags.push({
                openingTag: parts.openingTag,
                closingTag: parts.closingTag,
                content: content,
                completeTag: completeTag
            })
        }

        return completeTag
    })
    return {
        html: html,
        scriptTags: scriptTags
    }
}

export function getJSScriptTags(html){
    return processJSScriptTagsInHtml(html).scriptTags
}

export function replaceJSScriptTags(html, replaceFunction){
    return processJSScriptTagsInHtml(html, replaceFunction).html
}

export function getScriptElements(html){
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
            window.fromJSEnableTracing();
            scriptEl.text = tag.content // assignment will be processed by fromjs
            window.fromJSDisableTracing();
        }
        return scriptEl
    })
}
