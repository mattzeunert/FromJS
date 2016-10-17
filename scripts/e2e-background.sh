trap "echo \"kill bg\";pkill -P $$" SIGTERM SIGINT

node dist/server.js 9999 &
npm run ci-static-file-server &
node src/e2e/security/sec-server.js
