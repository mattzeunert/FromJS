trap "echo \"Killing child processes...\n\";pkill -P $$" EXIT SIGTERM SIGINT

npm run e2e-test-background-processes &
npm run protractor
