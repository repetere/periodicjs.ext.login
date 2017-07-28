'use strict';

var CoreMailer = require('periodicjs.core.mailer');
var CoreController = require('periodicjs.core.controller');
var path = require('path');
var templatesDir = path.resolve(__dirname, '..', 'views/mailer');
var appSettings;


//CoreController.getPluginViewDefaultTemplate({
//viewname: 'views/user/email/forgot',
//themefileext: appSettings.templatefileextension
//},
//function (err, templatepath) {
//if (templatepath === 'views/user/email/forgot') {
//templatepath = path.resolve(process.cwd(), 'node_modules/periodicjs.ext.login/views', templatepath + '.' + appSettings.templatefileextension);
//}
//changedemailtemplate = templatepath;
//}
//);
//CoreMailer.getTransport({
//appenvironment: appSettings.application.environment
//}, function (err, transport) {
//if (err) {
//console.error(err);
//}
//else {
//emailtransport = transport;
//}
//});
