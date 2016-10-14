import debuggerStatementFunction from "./debuggerStatementFunction"

function ValueMap(){
    this.charIndex = 0;
    this.items = [];
}
ValueMap.prototype.append = function(origin){
    this.appendString(origin.value, origin, 0)
}
ValueMap.prototype.appendString = function(str, origin, indexInOriginValue){
    if (indexInOriginValue === undefined) {
        debuggerStatementFunction()
    }

    if (!origin) {
        throw "need origin object"
    }

    var newCharIndex = this.charIndex + str.length;
    this.items.push({
        origin: origin,
        fromCharIndex: this.charIndex,
        toCharIndex: newCharIndex,
        __justForDebuggingStr: str,
        indexInOriginValue: indexInOriginValue
    })
    this.charIndex = newCharIndex
}
ValueMap.prototype.getItemAt = function(charIndex){
    var matchingItems = this.items.filter(function(o){
        return o.fromCharIndex <= charIndex && o.toCharIndex > charIndex
    })
    if (matchingItems.length === 0) {throw "no matches :/"}
    var matchingItem
    if (matchingItems.length > 1 && matchingItems[0].originObject.value === "") {
        // "" can't ever meaningfully be the source of a visible string
        matchingItem = matchingItems[1]
    }
    else {
        matchingItem = matchingItems[0]
    }

    var itemsBeforeMatch = this.items.slice(0, this.items.indexOf(matchingItem));
    var charCountBeforeMatch = 0;
    itemsBeforeMatch.forEach(function(item){
        var len = item.toCharIndex - item.fromCharIndex
        charCountBeforeMatch += len
    })

    var origin = matchingItem.origin
    var characterIndex = charIndex - charCountBeforeMatch +
        matchingItem.indexInOriginValue;


    return {
        origin,
        characterIndex: characterIndex,
        __justForDebuggingStr: matchingItem.__justForDebuggingStr
    }
}
ValueMap.prototype.debuggingGetValue = function(){
    var value = "";
    this.items.forEach(function(item){
        value += item.__justForDebuggingStr;
    })
    return value;
}
ValueMap.prototype.serialize = function(inputValues){
    // console.log("serialize with", inputValues)
    var ret = this.items.map(function(item){
        var originObjectIndex = inputValues.indexOf(item.origin);
        var originObjectLiteral = null
        if (originObjectIndex === -1) {
            originObjectLiteral = item.origin
        }
        return {
            originObjectIndex,
            originObjectLiteral,
            fromCharIndex: item.fromCharIndex,
            toCharIndex: item.toCharIndex,
            __justForDebuggingStr: item.__justForDebuggingStr,
            indexInOriginValue: item.indexInOriginValue
        }
    })
    return ret
}
ValueMap.deserialize = function(serializedValueMap, inputValues){
    // console.log("deserialize with ", inputValues)
    var valueMap = new ValueMap();
    serializedValueMap.forEach(function(item){
        var origin;
        if (item.originObjectIndex !== -1){
            origin = inputValues[item.originObjectIndex];
        } else {
            origin = item.originObjectLiteral
        }
        valueMap.items.push({
            fromCharIndex: item.fromCharIndex,
            toCharIndex: item.toCharIndex,
            __justForDebuggingStr: item.__justForDebuggingStr,
            origin,
            indexInOriginValue: item.indexInOriginValue
        })
    })
    // console.log("deserialized valueMap", valueMap)
    return valueMap
}

if (typeof module !== "undefined") {
    module.exports = ValueMap
}
