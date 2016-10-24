exports.config = {
    framework: 'jasmine2',
    specs: ['**/*.e2e.js'],
    allScriptsTimeout: 500000,
     seleniumArgs: ['-browserTimeout=500'],
    capabilities: {
        browserName: "chrome",
        loggingPrefs: {browser:"ALL"},
        chromeOptions: {

            "args": ["load-extension=./chrome-extension/dist"]
        }
    },
    jasmineNodeOpts: {
        defaultTimeoutInterval: 500000
    },
    plugins: [
        {
            package: "protractor-console",
            logLevels: ["debug", "info", "warning", "severe"]
        }
    ]
}
