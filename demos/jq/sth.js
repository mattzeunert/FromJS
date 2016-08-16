var d = $.Deferred();
d.then(function(){
    $("div").append("cake")
})
d.resolve()