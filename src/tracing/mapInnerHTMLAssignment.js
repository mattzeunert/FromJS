import addElOrigin from "./addElOrigin"
import $ from "jquery"
import tagTypeHasClosingTag from "./tagTypeHasClosingTag"
import stringTraceUseValue from "./stringTraceUseValue"
import {goUpForDebugging} from "../whereDoesCharComeFrom"
import config from "../config"
import normalizeHtml, {normalizeHtmlAttribute} from "../normalizeHtml"
import _ from "underscore"
import {runFunctionWithTracingDisabled} from "./tracing"
import untracedToString from "../untracedToString"
import debuggerStatementFunction from "../debuggerStatementFunction"

var htmlEntityRegex = /^\&[#a-zA-Z0-9]+\;/
var whitespaceRegex = /^[\s]+/
var tagEndRegex = /^(\s+)\/?>/
var twoQuoteSignsRegex = /^['"]{2}/

// tries to describe the relationship between an assigned innerHTML value
// and the value you get back when reading el.innerHTML.
// e.g. you could assign "<input type='checkbox' checked>" and get back
// "<input type='checkbox' checked=''>"
// essentially this function serializes the elements content and compares it to the
// assigned value
export default function mapInnerHTMLAssignment(el, assignedInnerHTML, actionName, initialExtraCharsValue, contentEndIndex, nodesToIgnore){
    runFunctionWithTracingDisabled(function(){
        var serializedHtml = el.innerHTML
        var forDebuggingProcessedHtml = ""
        var charOffsetInSerializedHtml = 0;
        var charsAddedInSerializedHtml = 0;
        if (initialExtraCharsValue !== undefined){
            charsAddedInSerializedHtml = initialExtraCharsValue
        }
        var assignedString = untracedToString(assignedInnerHTML)
        if (contentEndIndex === 0) {
            contentEndIndex = assignedString.length
        }
        if (nodesToIgnore === undefined) {
            nodesToIgnore = [];
        }

        var error = Error() // used to get stack trace, rather than capturing a new one every time
        processNewInnerHtml(el)


        function getCharOffsetInAssignedHTML(){
            return charOffsetInSerializedHtml - charsAddedInSerializedHtml
        }

        function validateMapping(mostRecentOrigin){
            if (!config.validateHtmlMapping) {
                return
            }
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

        // get offsets by looking at how the assigned value compares to the serialized value
        // e.g. accounts for differeces between assigned "&" and serialized "&amp;"
        function getCharMappingOffsets(textAfterAssignment, charOffsetAdjustmentInAssignedHtml, tagName) {
            if (charOffsetAdjustmentInAssignedHtml === undefined) {
                charOffsetAdjustmentInAssignedHtml = 0;
            }
            var offsets = [];
            var extraCharsAddedHere = 0;

            for (var i=0; i<textAfterAssignment.length; i++) {
                offsets.push(-extraCharsAddedHere)
                var char = textAfterAssignment[i];

                var htmlEntityMatchAfterAssignment = textAfterAssignment.substr(i,30).match(htmlEntityRegex)

                var posInAssignedString = charOffsetInSerializedHtml + i - charsAddedInSerializedHtml + charOffsetAdjustmentInAssignedHtml - extraCharsAddedHere;
                if (posInAssignedString >= contentEndIndex) {
                    // http://stackoverflow.com/questions/38892536/why-do-browsers-append-extra-line-breaks-at-the-end-of-the-body-tag
                    break; // just don't bother for now
                }

                var textIncludingAndFollowingChar = assignedString.substr(posInAssignedString, 30); // assuming that no html entity is longer than 30 chars
                if (char === "\n" && textIncludingAndFollowingChar[0] == "\r") {
                    extraCharsAddedHere--;
                }

                var htmlEntityMatch = textIncludingAndFollowingChar.match(htmlEntityRegex)

                if (tagName === "NOSCRIPT" && htmlEntityMatchAfterAssignment !== null && htmlEntityMatch !== null) {
                    // NOSCRIPT assignments: "&amp;" => "&amp;amp;", "&gt;" => "&amp;gt;"
                    // so we manually advance over the "&amp;"
                    for (var n=0; n<"amp;".length; n++) {
                        i++;
                        extraCharsAddedHere++;
                        offsets.push(-extraCharsAddedHere)
                    }
                    offsets.push(-extraCharsAddedHere)
                }

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

            if (offsets.length === 0) {
                offsets = undefined
            }
            return {
                offsets: offsets,
                extraCharsAddedHere: extraCharsAddedHere
            }
        }


        function processNewInnerHtml(el){
            var children = Array.prototype.slice.apply(el.childNodes, [])
            addElOrigin(el, "replaceContents", {
                action: actionName,
                children: children
            });

            var childNodesToProcess = [].slice.call(el.childNodes);
            childNodesToProcess = _.filter(childNodesToProcess, function(childNode){
                var shouldIgnore = nodesToIgnore.indexOf(childNode) !== -1
                return !shouldIgnore
            })

            childNodesToProcess.forEach(function(child){
                var isTextNode = child.nodeType === 3
                var isCommentNode = child.nodeType === 8
                var isElementNode = child.nodeType === 1
                var isIframe = child

                if (isTextNode) {
                    var text = child.textContent
                    text = normalizeHtml(text, child.parentNode.tagName)
                    var res = getCharMappingOffsets(text, 0, child.parentNode.tagName)
                    var offsets = res.offsets
                    var extraCharsAddedHere = res.extraCharsAddedHere

                    addElOrigin(child, "textValue", {
                        action: actionName,
                        inputValues: [assignedInnerHTML],
                        value: serializedHtml,
                        inputValuesCharacterIndex: [charOffsetInSerializedHtml],
                        extraCharsAdded: charsAddedInSerializedHtml,
                        offsetAtCharIndex: offsets,
                        error: error
                    })

                    charsAddedInSerializedHtml += extraCharsAddedHere
                    charOffsetInSerializedHtml += text.length
                    forDebuggingProcessedHtml += text

                    validateMapping(child.__elOrigin.textValue)
                } else if (isCommentNode) {
                    addElOrigin(child, "commentStart", {
                        action: actionName,
                        inputValues: [assignedInnerHTML],
                        inputValuesCharacterIndex: [charOffsetInSerializedHtml],
                        value: serializedHtml
                    })

                    charOffsetInSerializedHtml += "<!--".length
                    forDebuggingProcessedHtml += "<!--";

                    addElOrigin(child, "textValue", {
                        value: serializedHtml,
                        inputValues: [assignedInnerHTML],
                        inputValuesCharacterIndex: [charOffsetInSerializedHtml],
                        action: actionName,
                        error: error
                    })
                    charOffsetInSerializedHtml += child.textContent.length
                    forDebuggingProcessedHtml += child.textContent;

                    addElOrigin(child, "commentEnd", {
                        action: actionName,
                        inputValues: [assignedInnerHTML],
                        inputValuesCharacterIndex: [charOffsetInSerializedHtml],
                        inputValues: [],
                        value: serializedHtml
                    })
                    charOffsetInSerializedHtml += "-->".length
                    forDebuggingProcessedHtml += "-->";
                } else if (isElementNode) {
                    addElOrigin(child, "openingTagStart", {
                        action: actionName,
                        inputValues: [assignedInnerHTML],
                        inputValuesCharacterIndex: [charOffsetInSerializedHtml],
                        value: serializedHtml,
                        extraCharsAdded: charsAddedInSerializedHtml,
                        error: error
                    })
                    var openingTagStart = "<" + child.tagName
                    charOffsetInSerializedHtml += openingTagStart.length
                    forDebuggingProcessedHtml += openingTagStart

                    validateMapping(child.__elOrigin.openingTagStart)

                    for (var i = 0;i<child.attributes.length;i++) {
                        let extraCharsAddedHere = 0;
                        var attr = child.attributes[i]

                        var charOffsetInSerializedHtmlBefore = charOffsetInSerializedHtml

                        var whitespaceBeforeAttributeInSerializedHtml = " "; // always the same
                        var assignedValueFromAttrStartOnwards = assignedString.substr(getCharOffsetInAssignedHTML(), 100)
                        var whitespaceMatches = assignedValueFromAttrStartOnwards.match(whitespaceRegex)

                        var whitespaceBeforeAttributeInAssignedHtml;
                        if (whitespaceMatches !== null) {
                            whitespaceBeforeAttributeInAssignedHtml = whitespaceMatches[0]
                        } else {
                            // something broke, but better to show a broken result than nothing at all
                            if (config.validateHtmlMapping) {
                                console.warn("no whitespace found at start of", assignedValueFromAttrStartOnwards)
                            }
                            whitespaceBeforeAttributeInAssignedHtml = "";
                        }

                        var attrStr = attr.name
                        var textAfterAssignment = normalizeHtmlAttribute(attr.textContent)
                        attrStr += "='" + textAfterAssignment +  "'"

                        var offsetAtCharIndex = []

                        var extraWhitespaceInAssignedHtml = whitespaceBeforeAttributeInAssignedHtml.length - whitespaceBeforeAttributeInSerializedHtml.length
                        extraCharsAddedHere -= extraWhitespaceInAssignedHtml

                        offsetAtCharIndex.push(-extraCharsAddedHere); // char index for " " before attr

                        if (attr.textContent === ""){
                            var offsetInAssigned = getCharOffsetInAssignedHTML() + whitespaceBeforeAttributeInAssignedHtml.length
                            offsetInAssigned += attr.name.length + "=".length
                            var firstTwoValueChars = assignedString.substr(offsetInAssigned, 2)
                            if (twoQuoteSignsRegex.test(firstTwoValueChars)) {
                                for (var charIndex in attrStr){
                                    offsetAtCharIndex.push(-extraCharsAddedHere)
                                }
                            } else {
                                for (var charIndex in attrStr){
                                    if (charIndex >= attrStr.length - '=""'.length){
                                        extraCharsAddedHere++;
                                        offsetAtCharIndex.push(-extraCharsAddedHere)
                                    } else {
                                        offsetAtCharIndex.push(-extraCharsAddedHere)
                                    }
                                }
                            }
                        } else {
                            var attrStrStart = attr.name + "='"
                            for (var charIndex in attrStrStart){
                                offsetAtCharIndex.push(-extraCharsAddedHere)
                            }

                            var charOffsetAdjustmentInAssignedHtml = whitespaceBeforeAttributeInAssignedHtml.length + attrStrStart.length
                            var res = getCharMappingOffsets(textAfterAssignment, charOffsetAdjustmentInAssignedHtml, child.tagName)

                            if (res.offsets === undefined){
                                // Pretty sure this can only happen if there is a bug further up, but for now
                                // allow it to happen rather than breaking everything
                                // specifically this was happening on StackOverflow, probably because we don't
                                // support tables yet (turn <table> into <table><tbody>),
                                // but once that is supported this might just fix itself
                                console.warn("No offsets for attribute mapping")
                                for (var i in textAfterAssignment){
                                    offsetAtCharIndex.push(-extraCharsAddedHere)
                                }
                            }
                            else {
                                    res.offsets.forEach(function(offset, i){
                                    offsetAtCharIndex.push(offset - extraCharsAddedHere)
                                })
                                extraCharsAddedHere += res.extraCharsAddedHere
                            }

                            var lastOffset = _.last(offsetAtCharIndex)
                            offsetAtCharIndex.push(lastOffset) // map the "'" after the attribute value
                        }

                        addElOrigin(child, "attribute_" + attr.name, {
                            action: actionName,
                            inputValues: [assignedInnerHTML],
                            value: serializedHtml,
                            inputValuesCharacterIndex: [charOffsetInSerializedHtmlBefore],
                            extraCharsAdded: charsAddedInSerializedHtml,
                            offsetAtCharIndex: offsetAtCharIndex,
                            error: error
                        })

                        charsAddedInSerializedHtml += extraCharsAddedHere

                         charOffsetInSerializedHtml += whitespaceBeforeAttributeInSerializedHtml.length + attrStr.length
                        forDebuggingProcessedHtml += whitespaceBeforeAttributeInSerializedHtml + attrStr

                        var attrPropName = "attribute_" + attr.name;
                        validateMapping(child.__elOrigin[attrPropName])
                    }

                    var openingTagEnd = ">"

                    var assignedStringFromCurrentOffset = assignedString.substr(getCharOffsetInAssignedHTML(), 200)
                    if (assignedStringFromCurrentOffset === "") {
                        debuggerStatementFunction()
                    }
                    var matches = assignedStringFromCurrentOffset.match(tagEndRegex);
                    var whitespaceBeforeClosingAngleBracketInAssignedHTML = "";
                    if (matches !== null){
                        // something like <div > (with extra space)
                        // this char will not show up in the re-serialized innerHTML
                        whitespaceBeforeClosingAngleBracketInAssignedHTML = matches[1]
                    }
                    charsAddedInSerializedHtml -= whitespaceBeforeClosingAngleBracketInAssignedHTML.length;

                    if (!tagTypeHasClosingTag(child.tagName)) {
                        if (assignedString[getCharOffsetInAssignedHTML()] === "/") {
                            // something like <div/>
                            // this char will not show up in the re-serialized innerHTML
                            charsAddedInSerializedHtml -= 1;
                        } else {
                            var explicitClosingTag = "</" + child.tagName.toLowerCase() + ">"
                            var explicitClosingTagAndOpeningTagEnd = ">" + explicitClosingTag
                            if (assignedString.substr(getCharOffsetInAssignedHTML(), explicitClosingTagAndOpeningTagEnd.length).toLowerCase() === explicitClosingTagAndOpeningTagEnd) {
                                // something like <div></div>
                                // this char will not show up in the re-serialized innerHTML
                                charsAddedInSerializedHtml -= explicitClosingTag.length;
                            }
                        }
                    }
                    addElOrigin(child, "openingTagEnd", {
                        action: actionName,
                        inputValues: [assignedInnerHTML],
                        inputValuesCharacterIndex: [charOffsetInSerializedHtml],
                        value: serializedHtml,
                        extraCharsAdded: charsAddedInSerializedHtml,
                        error: error
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
                            extraCharsAdded: charsAddedInSerializedHtml,
                            error: error
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
    })
}
