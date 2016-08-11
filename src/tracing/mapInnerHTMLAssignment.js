import addElOrigin from "./addElOrigin"
import $ from "jquery"
import tagTypeHasClosingTag from "./tagTypeHasClosingTag"
import stringTraceUseValue from "./stringTraceUseValue"

// tries to describe the relationship between an assigned innerHTML value
// and the value you get back when reading el.innerHTML.
// e.g. you could assign "<input type='checkbox' checked>" and get back
// "<input type='checkbox' checked=''>"
export default function mapInnerHTMLAssignment(el, assignedInnerHTML, actionName, initialExtraCharsValue, contentEndIndex){
    var innerHTMLAfterAssignment = nativeInnerHTMLDescriptor.get.call(el)
    var forDebuggingProcessedHtml = ""
    // charOffset in the resulting HTML, not the assigned HTML
    var charOffset = 0;
    var extraCharsAdded = 0;
    if (initialExtraCharsValue !== undefined){
        extraCharsAdded = initialExtraCharsValue
    }
    if (contentEndIndex === 0) {
        contentEndIndex = assignedInnerHTML.toString().length
    }
    var assigned = assignedInnerHTML.value ? assignedInnerHTML.value : assignedInnerHTML; // somehow  getting weird non-string, non fromjs-string values
    processNewInnerHtml(el)

    function getCharOffsetInAssignedHTML(){
        return charOffset - extraCharsAdded
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
                var div = document.createElement("div")
                nativeInnerHTMLDescriptor.set.call(div, text)
                text = div.innerHTML.toString()
                var offsets = []

                for (var i=0; i<text.length; i++) {
                    var char = text[i];

                    var htmlEntityMatchAfterAssignment = text.substr(i,30).match(/^\&[a-z]+\;/)

                    var posInAssignedString = charOffset + i - extraCharsAdded - extraCharsAddedHere;
                    if (contentEndIndex >= posInAssignedString) {
                        // http://stackoverflow.com/questions/38892536/why-do-browsers-append-extra-line-breaks-at-the-end-of-the-body-tag
                        break; // just don't bother for now
                    }
                    var textIncludingAndFollowingChar = assigned.substr(posInAssignedString, 30); // assuming that no html entity is longer than 30 chars
                    var htmlEntityMatch = textIncludingAndFollowingChar.match(/^\&[a-z]+\;/)

                    offsets.push(extraCharsAddedHere)

                    if (htmlEntityMatchAfterAssignment !== null && htmlEntityMatch === null) {
                        // assigned a character, but now it shows up as an entity (e.g. & ==> &amp;)
                        var entity = htmlEntityMatchAfterAssignment[0]
                        for (var n=0; n<entity.length-1;n++){
                            i++
                            extraCharsAddedHere--;
                            offsets.push(extraCharsAddedHere)
                        }
                    }

                    if (htmlEntityMatchAfterAssignment === null && htmlEntityMatch !== null) {
                        // assigned an html entity but now getting character back (e.g. &raquo; => »)
                        var entity = htmlEntityMatch[0]
                        extraCharsAddedHere += entity.length - 1;
                    }
                }

                addElOrigin(child, "textValue", {
                    action: actionName,
                    inputValues: [assignedInnerHTML],
                    value: innerHTMLAfterAssignment,
                    inputValuesCharacterIndex: [charOffset],
                    extraCharsAdded: extraCharsAdded,
                    offsetAtCharIndex: offsets
                })

                extraCharsAdded += extraCharsAddedHere
                charOffset += child.textContent.length
                forDebuggingProcessedHtml += child.textContent
//                 if (child.textContent === "&&stuff&&does this works") {
//
// debugger
//                     forDebuggingProcessedHtml += child.textContent
//                     addElOrigin(child, "textValue", {
//                         "action": actionName,
//                         inputValues: [assignedInnerHTML],
//                         value: innerHTMLAfterAssignment,
//                         inputValuesCharacterIndex: [charOffset],
//                         extraCharsAdded: extraCharsAdded,
//                         offsetAtCharIndex: [ 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-1,-2,-3,-4,-4,-5,-6,-7,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8,-8, ]
//                                         //  "& a m p ; & a m p ; s t u f f & a  m  p  ;  &  a  m  p  ;  d o e s   t h i s   w o r k s"
//                                         //  "& a m p ; & a m p ; s t u f f & & d o e s   t h i s   w o r k s"
//                     })
//                     extraCharsAdded += 8;
//                     charOffset += child.textContent.length
//                 } else {
//                     addElOrigin(child, "textValue", {
//                         "action": actionName,
//                         inputValues: [assignedInnerHTML],
//                         value: innerHTMLAfterAssignment,
//                         inputValuesCharacterIndex: [charOffset],
//                         extraCharsAdded: extraCharsAdded
//                     })
//                     charOffset += child.textContent.length
//                     forDebuggingProcessedHtml += child.textContent
//                 }
            } else if (isCommentNode) {
                // do nothing?
            } else if (isElementNode) {

                addElOrigin(child, "openingTagStart", {
                    action: actionName,
                    inputValues: [assignedInnerHTML],
                    inputValuesCharacterIndex: [charOffset],
                    value: innerHTMLAfterAssignment,
                    extraCharsAdded: extraCharsAdded
                })
                var openingTagStart = "<" + child.tagName
                charOffset += openingTagStart.length
                forDebuggingProcessedHtml += openingTagStart

                for (var i = 0;i<child.attributes.length;i++) {
                    var attr = child.attributes[i]

                    var charOffsetBefore = charOffset

                    var attrStr = " " + attr.name
                    attrStr += "='" + attr.textContent +  "'"

                    var assignedAttrStr = assigned.toString().substr(getCharOffsetInAssignedHTML(), attrStr.length)

                    charOffset += attrStr.length
                    var offsetAtCharIndex = null
                    var extraCharsAddedHere = 0;

                    if (attr.textContent === "" && !attrStrContainsEmptyValue(assignedAttrStr)){
                        //charOffset += "'='".length
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
                        value: innerHTMLAfterAssignment,
                        inputValuesCharacterIndex: [charOffsetBefore],
                        extraCharsAdded: extraCharsAdded,
                        offsetAtCharIndex: offsetAtCharIndex
                    })

                    extraCharsAdded += extraCharsAddedHere

                    forDebuggingProcessedHtml += attrStr
                }


                var openingTagEnd = ">"
                if (assignedInnerHTML.toString()[charOffset] === " ") {
                    // something like <div > (with extra space)
                    // this char will not show up in the re-serialized innerHTML
                    extraCharsAdded -= 1;
                }
                addElOrigin(child, "openingTagEnd", {
                    action: actionName,
                    inputValues: [assignedInnerHTML],
                    inputValuesCharacterIndex: [charOffset],
                    value: innerHTMLAfterAssignment,
                    extraCharsAdded: extraCharsAdded
                })
                charOffset += openingTagEnd.length
                forDebuggingProcessedHtml += openingTagEnd

                if (child.tagName === "IFRAME") {
                    forDebuggingProcessedHtml += child.outerHTML;
                    charOffset += child.outerHTML
                } else {
                    processNewInnerHtml(child)
                }

                if (tagTypeHasClosingTag(child.tagName)) {
                    addElOrigin(child, "closingTag", {
                        action: actionName,
                        inputValues: [assignedInnerHTML],
                        inputValuesCharacterIndex: [charOffset],
                        value: innerHTMLAfterAssignment,
                        extraCharsAdded: extraCharsAdded
                    })
                    var closingTag = "</" + child.tagName + ">"
                    charOffset += closingTag.length
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
