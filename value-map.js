function ValueMap(){
    this.charIndex = 0;
    this.items = [];
}
ValueMap.prototype.append = function(originObject){
    this.appendString(originObject.value, originObject)
}
ValueMap.prototype.appendString = function(str, originObject){
    var newCharIndex = this.charIndex + str.length;
    this.items.push({
        originObject: originObject,
        fromCharIndex: this.charIndex,
        toCharIndex: newCharIndex,
        __justForDebuggingStr: str
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
    var charsBelongingToMatchedOrigin = 0;
    itemsBeforeMatch.forEach(function(item){
        var len = item.toCharIndex - item.fromCharIndex
        charCountBeforeMatch += len
        if (item.originObject === matchingItem.originObject) {
            // an origin can be split into multiple items, e.g. <div>....</div> (item at start and end)
            charsBelongingToMatchedOrigin += len;
        }
    })

    var originObject = matchingItem.originObject
    var characterIndex = charIndex - charCountBeforeMatch + charsBelongingToMatchedOrigin

    console.log("char is", originObject.value[characterIndex])

    return {
        originObject: originObject,
        characterIndex: parseFloat(characterIndex)
    }
}
ValueMap.prototype.debugginGetValue = function(){
    var value = "";
    this.items.forEach(function(item){
        value += item.__justForDebuggingStr;
    })
    return value;
}
ValueMap.prototype.serialize = function(inputValues){
    console.log("serialize with", inputValues)
    var ret = this.items.map(function(item){
        return {
            originObjectIndex: inputValues.indexOf(item.originObject),
            fromCharIndex: item.fromCharIndex,
            toCharIndex: item.toCharIndex,
            __justForDebuggingStr: item.__justForDebuggingStr
        }
    })
    return ret
}
ValueMap.deserialize = function(serializedValueMap, inputValues){
    console.log("deserialize with ", inputValues)
    var valueMap = new ValueMap();
    serializedValueMap.forEach(function(item){
        valueMap.items.push({
            fromCharIndex: item.fromCharIndex,
            toCharIndex: item.toCharIndex,
            __justForDebuggingStr: item.__justForDebuggingStr,
            originObject: inputValues[item.originObjectIndex]
        })
    })
    console.log("deserialized valueMap", valueMap)
    return valueMap
}

if (typeof module !== "undefined") {
    module.exports = ValueMap
}
