const prompt = require('./run')

const scripts = {
  development: 'yarn run-android-dev',
  staging: 'yarn run-android-staging',
  production: 'yarn run-android-production'
}

prompt({
  scripts,
  message: 'In which environment do you want to run the Android app?'
})
