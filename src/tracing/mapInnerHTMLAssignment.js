import addElOrigin from "./addElOrigin"
import $ from "jquery"
import tagTypeHasClosingTag from "./tagTypeHasClosingTag"
import stringTraceUseValue from "./stringTraceUseValue"
import {goUpForDebugging} from "../whereDoesCharComeFrom"

// tries to describe the relationship between an assigned innerHTML value
// and the value you get back when reading el.innerHTML.
// e.g. you could assign "<input type='checkbox' checked>" and get back
// "<input type='checkbox' checked=''>"
// essentially this function serializes the elements content and compares it to the 
// assigned value
export default function mapInnerHTMLAssignment(el, assignedInnerHTML, actionName, initialExtraCharsValue, contentEndIndex){
    var serializedHtml = nativeInnerHTMLDescriptor.get.call(el)
    var forDebuggingProcessedHtml = ""
    var charOffsetInSerializedHtml = 0;
    var charsAddedInSerializedHtml = 0;
    if (initialExtraCharsValue !== undefined){
        charsAddedInSerializedHtml = initialExtraCharsValue
    }
    var assignedString = assignedInnerHTML.value ? assignedInnerHTML.value : assignedInnerHTML; // somehow  getting weird non-string, non fromjs-string values
    if (contentEndIndex === 0) {
        contentEndIndex = assignedString.length
    }
    processNewInnerHtml(el)

    function getCharOffsetInAssignedHTML(){
        return charOffsetInSerializedHtml - charsAddedInSerializedHtml
    }

    function validateMapping(mostRecentOrigin){
        var step = {
            originObject: mostRecentOrigin,
            characterIndex: charOffsetInSerializedHtml - 1
        }
        
        goUpForDebugging(step, function(newStep){
            if (assignedString[newStep.characterIndex] !== serializedHtml[charOffsetInSerializedHtml - 1]){
                // This doesn't necessarily mean anything is going wrong.
                // For example, you'll get this warning every time you assign an 
                // attribute like this: <a checked>
                // because it'll be changed into: <a checked="">
                // and then we compare the last char of the attribute,
                // which will be 'd' in the assigned string and '"' in
                // the serialized string
                // however, I don't think there's ever a reason for this to be
                // called repeatedly. That would indicate a offset problem that 
                // gets carried through the rest of the assigned string
                console.warn("strings don't match", assignedString[newStep.characterIndex], serializedHtml[charOffsetInSerializedHtml - 1])
            }
        })
    }

    function processNewInnerHtml(el){
        var children = Array.prototype.slice.apply(el.childNodes, [])
        addElOrigin(el, "replaceContents", {
            action: actionName,
            children: children
        });

        [].slice.call(el.childNodes).forEach(function(child){
            var isTextNode = child.nodeType === 3
            var isCommentNode = child.nodeType === 8
            var isElementNode = child.nodeType === 1
            var isIframe = child
            var extraCharsAddedHere = 0;
            if (isTextNode) {

                var text = child.textContent
                if (child.parentNode.tagName !== "SCRIPT") {
                    var div = document.createElement("div")
                    nativeInnerHTMLDescriptor.set.call(div, text)
                    text = div.innerHTML.toString()
                }
                var offsets = []

                for (var i=0; i<text.length; i++) {
                    var char = text[i];

                    var htmlEntityMatchAfterAssignment = text.substr(i,30).match(/^\&[a-z]+\;/)

                    var posInAssignedString = charOffsetInSerializedHtml + i - charsAddedInSerializedHtml - extraCharsAddedHere;
                    if (contentEndIndex >= posInAssignedString) {
                        // http://stackoverflow.com/questions/38892536/why-do-browsers-append-extra-line-breaks-at-the-end-of-the-body-tag
                        break; // just don't bother for now
                    }
                    var textIncludingAndFollowingChar = assignedString.substr(posInAssignedString, 30); // assuming that no html entity is longer than 30 chars
                    var htmlEntityMatch = textIncludingAndFollowingChar.match(/^\&[a-z]+\;/)

                    offsets.push(-extraCharsAddedHere)

                    if (htmlEntityMatchAfterAssignment !== null && htmlEntityMatch === null) {
                        // assigned a character, but now it shows up as an entity (e.g. & ==> &amp;)
                        var entity = htmlEntityMatchAfterAssignment[0]
                        for (var n=0; n<entity.length-1;n++){
                            i++
                            extraCharsAddedHere++;
                            offsets.push(-extraCharsAddedHere)
                        }
                    }

                    if (htmlEntityMatchAfterAssignment === null && htmlEntityMatch !== null) {
                        // assigned an html entity but now getting character back (e.g. &raquo; => »)
                        var entity = htmlEntityMatch[0]
                        extraCharsAddedHere -= entity.length - 1;
                    }
                }

                addElOrigin(child, "textValue", {
                    action: actionName,
                    inputValues: [assignedInnerHTML],
                    value: serializedHtml,
                    inputValuesCharacterIndex: [charOffsetInSerializedHtml],
                    extraCharsAdded: charsAddedInSerializedHtml,
                    offsetAtCharIndex: offsets
                })

                charsAddedInSerializedHtml += extraCharsAddedHere
                charOffsetInSerializedHtml += text.length
                forDebuggingProcessedHtml += text

                validateMapping(child.__elOrigin.textValue)
            } else if (isCommentNode) {
                // do nothing?
            } else if (isElementNode) {

                addElOrigin(child, "openingTagStart", {
                    action: actionName,
                    inputValues: [assignedInnerHTML],
                    inputValuesCharacterIndex: [charOffsetInSerializedHtml],
                    value: serializedHtml,
                    extraCharsAdded: charsAddedInSerializedHtml
                })
                var openingTagStart = "<" + child.tagName
                charOffsetInSerializedHtml += openingTagStart.length
                forDebuggingProcessedHtml += openingTagStart

                validateMapping(child.__elOrigin.openingTagStart)

                for (var i = 0;i<child.attributes.length;i++) {
                    var attr = child.attributes[i]

                    var charOffsetInSerializedHtmlBefore = charOffsetInSerializedHtml

                    var attrStr = " " + attr.name
                    attrStr += "='" + attr.textContent +  "'"

                    var assignedAttrStr = assignedString.substr(getCharOffsetInAssignedHTML(), attrStr.length)

                    charOffsetInSerializedHtml += attrStr.length
                    var offsetAtCharIndex = null
                    var extraCharsAddedHere = 0;

                    if (attr.textContent === "" && !attrStrContainsEmptyValue(assignedAttrStr)){
                        extraCharsAddedHere = "=''".length

                        offsetAtCharIndex = []
                        for (var charIndex in attrStr){
                            if (charIndex >= attrStr.length - '=""'.length){
                                offsetAtCharIndex.push(attrStr.length - "=''".length - charIndex - 1)
                            } else {
                                offsetAtCharIndex.push(0)
                            }
                        }
                    }

                    addElOrigin(child, "attribute_" + attr.name, {
                        action: actionName,
                        inputValues: [assignedInnerHTML],
                        value: serializedHtml,
                        inputValuesCharacterIndex: [charOffsetInSerializedHtmlBefore],
                        extraCharsAdded: charsAddedInSerializedHtml,
                        offsetAtCharIndex: offsetAtCharIndex
                    })

                    charsAddedInSerializedHtml += extraCharsAddedHere

                    forDebuggingProcessedHtml += attrStr

                    var attrPropName = "attribute_" + attr.name;
                    validateMapping(child.__elOrigin[attrPropName])
                }



                var openingTagEnd = ">"
                if (assignedInnerHTML.toString()[getCharOffsetInAssignedHTML()] === " ") {
                    // something like <div > (with extra space)
                    // this char will not show up in the re-serialized innerHTML
                    charsAddedInSerializedHtml -= 1;
                }
                addElOrigin(child, "openingTagEnd", {
                    action: actionName,
                    inputValues: [assignedInnerHTML],
                    inputValuesCharacterIndex: [charOffsetInSerializedHtml],
                    value: serializedHtml,
                    extraCharsAdded: charsAddedInSerializedHtml
                })
                charOffsetInSerializedHtml += openingTagEnd.length
                forDebuggingProcessedHtml += openingTagEnd

                validateMapping(child.__elOrigin.openingTagEnd)


                if (child.tagName === "IFRAME") {
                    forDebuggingProcessedHtml += child.outerHTML;
                    charOffsetInSerializedHtml += child.outerHTML.length
                } else {
                    processNewInnerHtml(child)
                }

                if (tagTypeHasClosingTag(child.tagName)) {
                    addElOrigin(child, "closingTag", {
                        action: actionName,
                        inputValues: [assignedInnerHTML],
                        inputValuesCharacterIndex: [charOffsetInSerializedHtml],
                        value: serializedHtml,
                        extraCharsAdded: charsAddedInSerializedHtml
                    })
                    var closingTag = "</" + child.tagName + ">"
                    charOffsetInSerializedHtml += closingTag.length
                    forDebuggingProcessedHtml += closingTag
                }

            } else {
                throw "not handled"
            }
            // console.log("processed", forDebuggingProcessedHtml, assignedInnerHTML.toString().toLowerCase().replace(/\"/g, "'") === forDebuggingProcessedHtml.toLowerCase())

        })
    }
}

var emptyAttrStrRegex = /.*=['"]{2}/
function attrStrContainsEmptyValue(attrStr) {
    return emptyAttrStrRegex.test(attrStr)
}
