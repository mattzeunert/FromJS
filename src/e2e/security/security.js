if (window.f__StringLiteral) {
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function(){
        if (httpRequest.readyState !== 4){return};
        testComplete();
        if (httpRequest.responseText.indexOf("SEC" + "RET") !== -1) {
            document.querySelector("#ajax").innerHTML = "FAILED"
        }
        console.log(httpRequest.responseText.value)
    };

    httpRequest.open('GET', "http://localhost:9855/insecure.json#.js");
    httpRequest.send();


    window.cb = function(responseText){
        testComplete();
        if (responseText.indexOf("SEC" + "RET") !== -1) {
            document.querySelector("#fetch-url").innerHTML = "FAILED"
        }
    }
    var data = {url:"http://localhost:9855/insecure.json".toString() , type: "fetchUrl".toString()};
    data.callbackName = "cb".toString();
    data.isFromJSExtensionMessage = true
    var event = new CustomEvent("RebroadcastExtensionMessage", {detail: data});
    window.dispatchEvent(event);
}
