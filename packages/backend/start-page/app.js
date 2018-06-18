const time = new Date();
const hours = time.getHours();
const minutes = padLeft(time.getMinutes().toString(), "0", 2);

let message = "It is <span>" + hours + "</span>";
message += ":";
message += "<span>" + minutes + "</span>";

fromJSInspect(message);
document.querySelector("#app").innerHTML = message;

function padLeft(str, paddingChar, length) {
  while (str.length < length) {
    str = paddingChar + str;
  }
  return str;
}

// fetch("https://api.ipify.org?format=json")
//   .then(function(r) {
//     return r.json();
//   })
//   .then(function(res) {
//     const v = res.ip;
//     fromJSInspect(v);
//   });
