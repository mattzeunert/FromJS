node dist/server.js &
fromJSServerProcessId=$!

webdriver-manager start &
webdriverManagerProcessId=$!

protractor e2e/conf.js
e2eTestExitCode=$?

kill $webdriverManagerProcessId
kill $fromJSServerProcessId

exit $e2eTestExitCode
