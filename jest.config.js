module.exports = {
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  transform: {
    "^.+\\.(ts|tsx)$": "./preprocessor.js"
  },
  testMatch: ["**/*.test.(ts|tsx)"]
};
