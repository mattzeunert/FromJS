exports.config = {
    framework: 'jasmine2',
    specs: ['**/*.e2e.js'],
    allScriptsTimeout: 20000,
     seleniumArgs: ['-browserTimeout=20'],
    capabilities: {
        browserName: "chrome",
        loggingPrefs: {browser:"ALL"},
        chromeOptions: {

            "args": ["load-extension=./chrome-extension/dist"]
        }
    },
    jasmineNodeOpts: {
        defaultTimeoutInterval: 20000
    },
    plugins: [
        {
            package: "protractor-console",
            logLevels: ["debug", "info", "warning", "severe"]
        }
    ]
}
