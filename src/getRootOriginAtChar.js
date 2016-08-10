import ValueMap from "../src/value-map"
import tagTypeHasClosingTag from "./tracing/tagTypeHasClosingTag"

window.getRootOriginAtChar = getRootOriginAtChar

var closingTagRegExp = /\<\/\w+\>$/;
var div = document.createElement("div")
function getHtmlFromString(str){
    // convert stuff like & to &amp;
    div.innerHTML = str;
    return div.innerHTML;
}

export default function getRootOriginAtChar(el, characterIndex, charIndexIsInInnerHTML){
    var innerHTML = el.innerHTML
    var closingTagMatches = el.outerHTML.match(closingTagRegExp)
    var closingTag = ""
    var tagIsSelfClosing = closingTagMatches === null
    if (!tagIsSelfClosing){
        closingTag = closingTagMatches[0]
    }
    var openingTag = el.outerHTML.substr(0,el.outerHTML.length - innerHTML.length - closingTag.length)

    if (charIndexIsInInnerHTML) {
        characterIndex += openingTag.length;
    }

    var vm = new ValueMap();
    vm.appendString(openingTag, "openingTag", 0)
    vm.appendString(innerHTML, "innerHTML", 0)
    vm.appendString(closingTag, "closingTag", 0)

    var item = vm.getItemAt(characterIndex)

    if (item.originObject === "openingTag") {
        var vm = new ValueMap();

        var openingTagStart = "<" + el.tagName
        vm.appendString(openingTagStart, el.__elOrigin.openingTagStart, 0)

        for (var i = 0;i<el.attributes.length;i++) {
            var attr = el.attributes[i]


            var attrStr = " " + attr.name

                attrStr += "='" + attr.textContent +  "'"

            var attrOrigin = el.__elOrigin["attribute_" + attr.name];
            if (attrOrigin === undefined) {
                // might mean we don't trace it, or we can't trace it, e.g. when
                // Chrome extensions modify the DOM
                attrOrigin = {
                    action: "Unknown Origin",
                    value: attr.textContent,
                    inputValues: []
                }
            }
            vm.appendString(attrStr, attrOrigin, 0)
        }

        var openingTagEnd = ""
        if (!tagTypeHasClosingTag(el.tagName)) {
            openingTagEnd +=  "/"
        }
        openingTagEnd += ">"
        vm.appendString(openingTagEnd, el.__elOrigin.openingTagEnd, 0)

        var item = vm.getItemAt(characterIndex)
        // console.log("is in opening tag at charIndex", characterIndex, "mapping to index", item.characterIndex, item)
        return {
            origin: item.originObject,
            characterIndex: item.characterIndex + (item.originObject.inputValuesCharacterIndex ? item.originObject.inputValuesCharacterIndex[0] : 0)
        }
    } else if (item.originObject === "closingTag") {
        var ivIndex =  el.__elOrigin.closingTag.inputValuesCharacterIndex
        var indexInClosingTag = item.characterIndex;
        return {
            origin: el.__elOrigin.closingTag,
            characterIndex: indexInClosingTag + (ivIndex ? ivIndex[0] : 0)
        }
    } else if (item.originObject === "innerHTML") {
        var vm = new ValueMap();
        characterIndex -= openingTag.length;
        el.__elOrigin.contents.forEach(function(el){
            var elIsTextNode = el.outerHTML === undefined
            if (elIsTextNode) {
                var contentHtml = getHtmlFromString(el.textContent)
                vm.appendString(contentHtml, el, 0)
            } else {
                vm.appendString(el.outerHTML, el, 0)
            }
        })
        var item = vm.getItemAt(characterIndex)
        var isTextNode = item.originObject.outerHTML === undefined;

        if (isTextNode) {
            var origin = item.originObject.__elOrigin.textValue
            return {
                characterIndex: item.characterIndex + (origin.inputValuesCharacterIndex ? origin.inputValuesCharacterIndex[0] : 0),
                origin: origin
            }
        }
        return getRootOriginAtChar(item.originObject, item.characterIndex)
    } else {
        throw "ooooossdfa"
    }

    return {
        origin: origin,
        characterIndex: characterIndex
    }
}
