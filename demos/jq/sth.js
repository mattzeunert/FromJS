var d = $.Deferred();
d.done(function(){
    var val = "sth" ? ("cake" ? ("" ? null : 0 || (99 && 88 ? "hey" + "ha" + (77 ? "he" : ""): "ho")) : "") : ""
    $("div").append(val)
})
d.resolve()
