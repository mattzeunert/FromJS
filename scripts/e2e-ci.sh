node dist/server.js &
fromJSServerProcessId=$!

npm run webdriver-manager &

npm run protractor
e2eTestExitCode=$?

kill $fromJSServerProcessId

exit $e2eTestExitCode
