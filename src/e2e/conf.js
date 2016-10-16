exports.config = {
    framework: 'jasmine2',
    specs: ['*.e2e.js'],
    capabilities: {
        browserName: "chrome",
        chromeOptions: {
            "args": ["load-extension=./chrome-extension/dist"]
        }
    }
}
