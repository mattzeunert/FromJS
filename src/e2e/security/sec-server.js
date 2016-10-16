var http = require("http");
http.createServer(handleRequest).listen(9855)

function handleRequest(request, response){
    if (request.url === "/init") {
        response.writeHead(200, {
            'Set-Cookie': 'val=SECRET',
        });
        response.write("Cookie set")
    }
    if (request.url === "/insecure.json") {
        response.write(JSON.stringify([parseCookies(request)]))

    }
    response.end()
}

function parseCookies (request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}
