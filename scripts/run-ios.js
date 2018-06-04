const prompt = require('./run')

const scripts = {
  development: 'yarn run-ios-dev',
  staging: 'yarn run-ios-staging',
  production: 'yarn run-ios-production'
}

prompt({
  scripts,
  message: 'In which environment do you want to run the iOS app?'
})
