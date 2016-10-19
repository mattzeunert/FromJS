import {replaceJSScriptTags, getJSScriptTags} from "./getJSScriptTags"

describe("replaceJSScriptTags", function(){
    it("Replaces script tags", function(){
        var html = `aaa<script >hello</script>bbb`
        html = replaceJSScriptTags(html, function(scriptContent){
            expect(scriptContent).toBe("hello")
            return "hi"
        })
        expect(html).toBe("aaa<script>hi</script>bbb")
    })
    it("Doesn't process script tags that don't contain JavaScript code", function(){
        var html = `aaa<script type="template">hello</script>bbb`
        html = replaceJSScriptTags(html, function(scriptContent){})
        expect(html).toBe('aaa<script type="template">hello</script>bbb')
    })
})

describe("getJSScriptTags", function(){
    it("Finds script tags", function(){
        var html = `aaa<script>hello</script>bbb`
        var scriptTags = getJSScriptTags(html)
        expect(scriptTags[0].content).toBe("hello")
    })
    it("Doesn't find commented out script tags", function(){
        var html = `aaa<!--<script>hello</script>-->bbb`
        var scriptTags = getJSScriptTags(html)
        expect(scriptTags.length).toBe(0)
    })
})
