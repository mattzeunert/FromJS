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
