export default class OriginPathStep {
    constructor(origin, characterIndex){
        this.origin = origin;
        this.characterIndex = parseFloat(characterIndex);
        if (isNaN(this.characterIndex)) {
            debugger;
            throw Error("OriginPathStep characterIndex is NaN")
        }
    }
}
