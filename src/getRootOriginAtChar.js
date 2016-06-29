import ValueMap from "../src/value-map"

function tagTypeHasClosingTag(tagName){
    return originalCreateElement.apply(document, [tagName]).outerHTML.indexOf("></") !== -1
}

export default function getRootOriginAtChar(el, characterIndex){

    var tagHtml = el.outerHTML.replace(el.innerHTML,"")
    var openingTag = tagHtml.split("></")[0] + ">"
    var closingTag = "</" +tagHtml.split("></")[1]
    var innerHTML = el.innerHTML

    var vm = new ValueMap();
    vm.appendString(openingTag, "openingTag", 0)
    vm.appendString(innerHTML, "innerHTML", 0)
    vm.appendString(closingTag, "closingTag", 0)

    var item = vm.getItemAt(characterIndex)

    if (item.originObject === "openingTag") {
        var vm = new ValueMap();

        var openingTagStart = "<" + el.tagName
        vm.appendString(openingTagStart, el.__elOrigin.tagName, 0)

        for (var i = 0;i<el.attributes.length;i++) {
            var attr = el.attributes[i]


            var attrStr = " " + attr.name
            if (attr.textContent !== ""){
                attrStr += "='" + attr.textContent +  "'"
            }

            vm.appendString(attrStr, el.__elOrigin["attribute_" + attr.name], 0)
        }

        var openingTagEnd = ""
        if (!tagTypeHasClosingTag(el.tagName)) {
            openingTagEnd +=  "/"
        }
        openingTagEnd += ">"
        vm.appendString(openingTagEnd, el.__elOrigin.tagName, 0)

        var item = vm.getItemAt(characterIndex)
        return {
            origin: item.originObject,
            characterIndex: item.characterIndex + (item.originObject.inputValuesCharacterIndex ? item.originObject.inputValuesCharacterIndex[0] : 0)
        }
    } else if (item.originObject === "closingTag") {
        return {
            origin: el.__elOrigin.tagName,
            characterIndex: 0 // not one hundred perecent accurate, but maybe close enough
        }
    } else if (item.originObject === "innerHTML") {
        var vm = new ValueMap();
        characterIndex -= openingTag.length;
        el.__elOrigin.contents.forEach(function(el){
            var elIsTextNode = el.outerHTML === undefined
            if (elIsTextNode) {
                vm.appendString(el.textContent, el, 0)
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
