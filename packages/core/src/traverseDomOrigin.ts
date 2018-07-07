// This isn't really well done, it would be nice if each origin was a traversable operation instead

export function traverseDomOrigin(origin, charIndex) {
  let offset = 0;
  if (origin.offsetAtCharIndex && origin.offsetAtCharIndex[charIndex]) {
    offset = origin.offsetAtCharIndex[charIndex];
  }
  return (
    charIndex +
    origin.inputValuesCharacterIndex[0] -
    origin.extraCharsAdded +
    offset
  );
}
