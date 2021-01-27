const sip = require('./build/Release/electron-baresip.node');
// const EventEmitter = require('events').EventEmitter;

// const inherits = require('util').inherits;

// inherits(sip.SipClientNode, EventEmitter);


sip.SipClient = sip.SipClientNode;
// Exposes the emit function to the native module
// console.dir(sip);
// console.dir(sip.SipClient);
//

// setTimeout(async () => {
//     var a = new sip.SipClient();
//     await a.register({
//             "auth": "1008",
//             "domain": "stage.webitel.com",
//             "extension": "1008",
//             "password": "igor",
//             "proxy": "sip:stage.webitel.com"
//         }
//     );
//
//     a.on('registered', () => {
//         console.error("registered");
//         a.unregister();
//     });
//     //
//     a.on('unregistered', () => {
//         console.error("unregistered");
//         sip.close();
//         process.exit(0);
//     });
//
//     setTimeout(() => {
//         a.unregister();
//         setTimeout(()=>{}, 1000);
//     }, 5000);
//
// }, 500);

//5000)

module.exports = sip;