const dotenv = require('dotenv')
dotenv.config({path: __dirname+'/.env'})
const {
  AWS_S3_BUCKET,
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY
} = process.env

const yargs = require('yargs')

const argv = yargs
  .option('all', {
    alias: 'a',
    boolean: true,
    default: false,
    description: 'bundle, upload, uploadVersions'
  })
  .option('bundle', {
    alias: 'b',
    boolean: true,
    default: false
  })
  .option('upload', {
    boolean: true,
    default: false
  })
  .option('uploadVersions', {
    boolean: true,
    default: false
  })
  .option('bundleVersion', {
    string: true,
    default: null,
    description: 'specify bundle version to use'
  })
  .option('dry', {
    boolean: true,
    default: false,
    description: "don't upload anything"
  })
  .help()
  .argv

// no command means all
if (!argv.all && !argv.bundle && !argv.upload && !argv.uploadVersions) {
  argv.all = true
}
if (argv.all) {
  argv.bundle = true
  argv.upload = true
  argv.uploadVersions = true
}

const spawn = require('child-process-promise').spawn
const fs = require('fs')
const mkdirp = require('mkdirp')
const Prompt = require('prompt-checkbox')
const Confirm = require('prompt-confirm')
const s3 = require('./lib/s3')

const VERSIONS_PATH = './versions.json'
const VERIONS_PATH_ABSOLUTE = `${__dirname}/versions.json`
const PLATFORMS = ['ios', 'android']

const getDateTime =
  () => new Date().toISOString().slice(0, -5)//.replace(/[^\d]/g, ':')


const mkdir = (path) => {
  fs.existsSync(path) || fs.mkdirSync(path)
}

const bundle = async (platform, output) => {
  mkdir(output)
  const promise = spawn('./node_modules/.bin/react-native', ['bundle',
    '--platform', `${platform}`,
    '--entry-file', 'index.js',
    '--bundle-output', `${output}/main.jsbundle`,
    '--assets-dest', `${output}/`,
    '--dev', 'false'
  ])
  const childProcess = promise.childProcess
  childProcess.stdout.on('data', function (data) {
    console.log('[react-native build]:', data.toString())
  })
  childProcess.stderr.on('data', function (data) {
    console.log('[react-native build]:', data.toString())
  })

  await promise
    .catch(function (err) {
      console.error('[react-native build] ERROR: ', err);
      throw new Error(err)
    })

  console.log('[react-native build] finished!')
}

const pack = (input, outputPath) => new Promise( (resolve, reject) => {
  const archive = require('archiver')('zip')
  const output = fs.createWriteStream(outputPath)

  output.on('close', () => {
    console.log(`[archive] ${archive.pointer()} total bytes written.`)
    resolve()
  })

  archive.on('error', (err) => {
    console.error(err)
    reject(err)
  })

  archive.pipe(output)
  archive.directory(input, '../') // put files at root of archive
  archive.finalize()
})

const updateVersionsFile = async (newBundleVersion) => {
  const versions = require(VERSIONS_PATH)

  const prompt = new Prompt({
    name: 'versions',
    message: `Which binary versions should get this update? (${newBundleVersion})`,
    choices: versions.map( v => v.bin )
  })
  const answerVersions = await prompt.run()

  if(answerVersions.length === 0) {
    console.log('Ok, none it is')
  } else {
    const urgentPrompt = new Confirm({
      name: 'urgent',
      message: 'Is this an **urgent** release?',
      default: false
    })
    const answerUrgent = await urgentPrompt.run()
    answerVersions.forEach( binVersion => {
      const versionEntry = versions.find( v => v.bin === binVersion)
      versionEntry.bundle = newBundleVersion
      if (!!answerUrgent) {
        versionEntry.urgent = true
      }
    })
    const newVersions = JSON.stringify(versions, null, 2)
    fs.writeFileSync(VERIONS_PATH_ABSOLUTE, newVersions)
    console.log(`new versions written to ${VERIONS_PATH_ABSOLUTE}:\n${newVersions})`)
  }

  console.log('Keep in mind: You can always update ota/versions.json manually and call this script with --uploadVersions')
}

const upload = async (outputPath, newBundleVersion) => {
  const basePath = `ota/`

  if(argv.uploadVersions || argv.upload) {
    console.log('uploading versions.json...')
    await s3.upload({
      stream: fs.createReadStream(VERIONS_PATH_ABSOLUTE),
      path: `${basePath}versions.json`,
      mimeType: 'application/json',
      bucket: AWS_S3_BUCKET
    })
  }
  if (argv.upload) {
    for(let platform of PLATFORMS) {
      console.log(`uploading ${platform}.zip...`)
      await s3.upload({
        stream: fs.createReadStream(`${outputPath}/${platform}.zip`),
        path: `${basePath}${newBundleVersion}/${platform}.zip`,
        mimeType: 'application/zip',
        bucket: AWS_S3_BUCKET
      })
    }
  }
}


return new Promise( async (resolve, reject) => {
  const newBundleVersion = argv.bundleVersion || getDateTime()
  const output = `${__dirname}/build/${newBundleVersion}`

  if (argv.bundle) {
    mkdirp.sync(output)
    console.log(`----\nversion: ${newBundleVersion}\noutput: ${output}\n-----`)

    for(let platform of PLATFORMS) {
      const workingDir = `${output}/${platform}`
      await bundle(platform, workingDir)
      await pack(workingDir, `${output}/${platform}.zip`)
    }
    await updateVersionsFile(newBundleVersion)
  }
  if (!argv.dry) {
    await upload(output, newBundleVersion)
  }

}
).then(() => {
  process.exit()
}).catch(e => {
  console.log(e)
  process.exit(1)
})
