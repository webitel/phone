var NwBuilder = require('nw-builder');
var nw = new NwBuilder({
    appName: 'Webitel Phone',
    zip: false,
    appVersion: '2.0.0',
    macIcns: './static/img/icons/icon.icns',
    winIco: './static/img/icons/icon.ico',
    files: './dist/**', // use the glob format',
    flavor: 'normal',
    buildDir: './desktop',
    cacheDir: '/tmp',
    platforms: ['win64', 'osx64', 'linux64'],
    version: '0.30.5'
});

//Log stuff you want

nw.on('log',  console.log);

// Build returns a promise
nw.build().then(function () {
    console.log('all done!');
}).catch(function (error) {
    console.error(error);
});
