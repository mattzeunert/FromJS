node dist/server.js &
fromJSServerProcessId=$!

npm run protractor
e2eTestExitCode=$?

kill $fromJSServerProcessId

exit $e2eTestExitCode
