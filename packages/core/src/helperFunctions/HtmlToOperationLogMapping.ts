export default class HtmlToOperationLogMapping {
  parts: any[];
  constructor(parts: any[]) {
    this.parts = parts;
  }
  getOriginAtCharacterIndex(charIndex: number) {
    let charCounter = 0;
    let partIndex = 0;
    while (charCounter <= charIndex) {
      const part = this.parts[partIndex];
      const [text, origin] = part;

      charCounter += text.length;

      partIndex++;
      if (partIndex > this.parts.length + 1) {
        throw Error("not found");
      }
    }

    const matchingPartIndex = partIndex - 1;
    const matchingPart = this.parts[matchingPartIndex];
    charCounter -= matchingPart[0].length;

    return {
      charIndex: charIndex - charCounter,
      origin: matchingPart[1]
    };
  }
}
