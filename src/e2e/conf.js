exports.config = {
    framework: 'jasmine2',
    specs: ['**/*.e2e.js'],
    allScriptsTimeout: 20000,
     seleniumArgs: ['-browserTimeout=20'],
    capabilities: {
        browserName: "chrome",
        chromeOptions: {
            "args": ["load-extension=./chrome-extension/dist"]
        }
    },
    jasmineNodeOpts: {
        defaultTimeoutInterval: 20000
    }
}
