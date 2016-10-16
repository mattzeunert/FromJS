trap "echo \"Killing child processes...\n\";pkill -P $$" EXIT SIGTERM SIGINT

node dist/server.js 9999 &
python -m SimpleHTTPServer 9856 &
node src/e2e/security/sec-server.js &

protractor src/e2e/conf.js
e2eTestExitCode=$?

exit $e2eTestExitCode
