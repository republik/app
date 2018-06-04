const inquirer = require('inquirer')
const { spawn } = require('child_process')

module.exports = ({ scripts, message }) => {
  const questions = [
    {
      message,
      type: 'list',
      name: 'env',
      choices: ['Development', 'Staging', 'Production'],
      filter: (val) => val.toLowerCase()
    }
  ]

  inquirer.prompt(questions).then(answers => {
    spawn(scripts[answers.env], {
      stdio: 'inherit',
      shell: true
    })
  })
}
