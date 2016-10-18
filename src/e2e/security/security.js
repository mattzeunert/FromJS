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
        if (responseText.indexOf("SEC" + "RET") !== -1) {
            document.querySelector("#fetch-url").innerHTML = "FAILED"
        }
        testComplete();
    }
    var data = {
        url: f__useValue("http://localhost:9855/insecure.json") ,
        type: f__useValue("fetchUrl")
    };
    data.callbackName = f__useValue("cb")
    data.isFromJSExtensionMessage = true
    var event = new CustomEvent("RebroadcastExtensionMessage", {detail: data});
    window.dispatchEvent(event);
}
