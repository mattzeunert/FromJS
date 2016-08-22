import ValueMap from "../src/value-map"
import tagTypeHasClosingTag from "./tracing/tagTypeHasClosingTag"
import getOpeningAndClosingTags from "./getOpeningAndClosingTags"
import normalizeHtml, {normalizeHtmlAttribute} from "./normalizeHtml"

window.getRootOriginAtChar = getRootOriginAtChar





export default function getRootOriginAtChar(el, characterIndex, charIndexIsInInnerHTML){
    var innerHTML = el.innerHTML
    var parts = getOpeningAndClosingTags(el.outerHTML, el.innerHTML)
    var openingTag = parts.openingTag;
    var closingTag = parts.closingTag

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
            attrStr += "='" + normalizeHtmlAttribute(attr.textContent) +  "'"

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
            var elIsTextNode = el.nodeType === Node.TEXT_NODE
            var elIsCommentNode = el.nodeType === Node.COMMENT_NODE
            if (elIsTextNode) {
                var contentHtml = normalizeHtml(el.textContent)
                vm.appendString(contentHtml, el, 0)
            } else if (elIsCommentNode){
                var contentHtml = "<!--" + el.textContent + "-->"
                vm.appendString(contentHtml, el, 0)
            }else {
                vm.appendString(el.outerHTML, el, 0)
            }
        })
        var item = vm.getItemAt(characterIndex)
        var itemNodeType = item.originObject.nodeType
        var isTextOrCommentNode = itemNodeType === Node.COMMENT_NODE || itemNodeType === Node.TEXT_NODE

        if (isTextOrCommentNode) {
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
