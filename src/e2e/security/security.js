if (window.f__StringLiteral) {
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function(){
        if (httpRequest.readyState !== 4){return};
        var done = document.createElement("div")
        done.innerHTML = "DONE"
        done.id = "security-done"
        document.body.appendChild(done)
        if (httpRequest.responseText.indexOf("SEC" + "RET") !== -1) {
            document.querySelector("#ajax").innerHTML = "FAILED"
        }
        console.log(httpRequest.responseText.value)
    };

    httpRequest.open('GET', "http://localhost:9855/insecure.json#.js");
    httpRequest.send();
}
