var NwBuilder = require('nw-builder');
var nw = new NwBuilder({
    appName: 'webitel-phone',
    zip: false,
    appVersion: '2.0.0',
    macIcns: './static/img/icons/icon.icns',
    winIco: './build/icon.ico',
    files: './dist/**', // use the glob format',
    flavor: 'normal',
    buildDir: './desktop',
    cacheDir: './desktop/.cache',
    platforms: ['win32'],
    version: '0.14.0'
});

//Log stuff you want

nw.on('log',  console.log);

// Build returns a promise
nw.build().then(function () {
    console.log('all done!');
}).catch(function (error) {
    console.error(error);
});
