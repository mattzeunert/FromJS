var httpRequest = new XMLHttpRequest();
httpRequest.onreadystatechange = function(){
    if (httpRequest.readyState !== 4){return};
    if (httpRequest.responseText.indexOf("SECRET") !== -1) {
        document.querySelector("#ajax").innerHTML = "FAILED"
    }
    console.log(httpRequest.responseText.value)
};
httpRequest.open('GET', "http://localhost:9855/insecure.json#.js");
httpRequest.send();
