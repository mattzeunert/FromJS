node dist/server.js 9999 &
fromJSServerProcessId=$!

protractor src/e2e/conf.js
e2eTestExitCode=$?

kill $fromJSServerProcessId

exit $e2eTestExitCode
