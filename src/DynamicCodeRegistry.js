

export default class DynamicCodeRegistry {
    register(filename, content, origin){
        fromJSDynamicFiles[filename] = content
        if (origin) {
            fromJSDynamicFileOrigins[filename] = origin
        }
    }
}
