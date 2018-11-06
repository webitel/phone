const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller
const path = require('path')

getInstallerConfig()
  .then(createWindowsInstaller)
  .catch((error) => {
    console.error(error.message || error)
    process.exit(1)
  })

function getInstallerConfig () {
  console.log('creating windows installer')
  const rootPath = path.join('./')
  const outPath = path.join(rootPath, 'release-builds')

  return Promise.resolve({
    appDirectory: path.join(outPath, 'webitel-phone-win32-x64/'),
    authors: 'Navrotskyj Igor',
    setupMsi: 'WebitelPhoneInstaller.msi',
    // noMsi: false,
    outputDirectory: path.join(outPath, 'windows-installer'),
    exe: 'webitel-phone.exe',
    setupExe: 'WebitelPhoneInstaller.exe',
    setupIcon: path.join(rootPath, 'static/img/icons/icon.ico')
  })
}
