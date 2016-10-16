node dist/server.js 9999 &
python -m SimpleHTTPServer 9856 &
node src/e2e/security/sec-server.js &

protractor src/e2e/conf.js
e2eTestExitCode=$?

pkill -P $$ # kill child processes
exit $e2eTestExitCode
