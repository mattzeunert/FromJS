node dist/server.js &
fromJSServerProcessId=$!

webdriver-manager update --standalone
webdriver-manager start --standalone &
webdriverManagerProcessId=$!

protractor e2e/conf.js
e2eTestExitCode=$?

kill $webdriverManagerProcessId
kill $fromJSServerProcessId

exit $e2eTestExitCode
