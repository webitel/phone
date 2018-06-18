var createMsi = require('msi-packager')

var options = {

  // required
  source: '/home/igor/work/webitel-phone/desktop/webitel-phone/win64',
  output: './webitel-phone.msi',
  name: 'Webitel phone',
  upgradeCode: 'YOUR-GUID-HERE',
  version: '1.0.0',
  manufacturer: 'webitel.ua',
  iconPath: '/home/igor/work/webitel-phone/static/img/icons/icon.ico',
  executable: 'webitel-phone.exe',

  // optional
  description: "Webitel phone",
  arch: 'x86',
  localInstall: false

}

createMsi(options, function (err) {
  if (err) throw err
  console.log('Outputed to ' + options.output)
})
