import ValueMap from "../src/value-map"
import tagTypeHasClosingTag from "./tracing/tagTypeHasClosingTag"
import getOpeningAndClosingTags from "./getOpeningAndClosingTags"
import normalizeHtml, {normalizeHtmlAttribute} from "./normalizeHtml"
import OriginPathStep from "./OriginPathStep"

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

    if (!el.__elOrigin) {
        throw Error("Selected element doesn't have any origin data. This may be because you opened the FromJS inspector before the page finished loading.")
    }

    if (item.origin === "openingTag") {
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
                attrOrigin = new Origin({
                    action: "Unknown Origin",
                    value: attr.textContent,
                    inputValues: []
                })
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

        var characterIndex = item.characterIndex + (item.origin.inputValuesCharacterIndex ? item.origin.inputValuesCharacterIndex[0] : 0)
        return new OriginPathStep(item.origin, characterIndex)
    } else if (item.origin === "closingTag") {
        var ivIndex =  el.__elOrigin.closingTag.inputValuesCharacterIndex
        var indexInClosingTag = item.characterIndex;

        var characterIndex = indexInClosingTag + (ivIndex ? ivIndex[0] : 0)
        return new OriginPathStep(el.__elOrigin.closingTag, characterIndex)
    } else if (item.origin === "innerHTML") {
        var vm = new ValueMap();
        characterIndex -= openingTag.length;
        Array.from(el.childNodes).forEach(function(el){
            var elIsTextNode = el.nodeType === Node.TEXT_NODE
            var elIsCommentNode = el.nodeType === Node.COMMENT_NODE
            if (elIsTextNode) {
                var contentHtml = normalizeHtml(el.textContent, el.parentNode.tagName)
                vm.appendString(contentHtml, el, 0)
            } else if (elIsCommentNode){
                var contentHtml = "<!--" + el.textContent + "-->"
                vm.appendString(contentHtml, el, 0)
            }else {
                vm.appendString(el.outerHTML, el, 0)
            }
        })
        var item = vm.getItemAt(characterIndex)
        var itemNodeType = item.origin.nodeType
        var isTextNode = itemNodeType === Node.TEXT_NODE
        var isCommentNode =  itemNodeType === Node.COMMENT_NODE

        if (isTextNode) {
            var origin = item.origin.__elOrigin.textValue
            var characterIndex = item.characterIndex + (origin.inputValuesCharacterIndex ? origin.inputValuesCharacterIndex[0] : 0);
            return new OriginPathStep(origin, characterIndex)
        }
        if (isCommentNode) {
            var vm = new ValueMap()
            var elOrigin = item.origin.__elOrigin
            vm.append(elOrigin.commentStart)
            vm.append(elOrigin.textValue)
            vm.append(elOrigin.commentEnd)

            var commentItem = vm.getItemAt(item.characterIndex)

            return new OriginPathStep(commentItem.origin, commentItem.characterIndex)
        }
        return getRootOriginAtChar(item.origin, item.characterIndex)
    } else {
        throw "ooooossdfa"
    }
}
