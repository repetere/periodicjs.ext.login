'use strict';

var logger,
	User,
	passport,
	loginExtSettings,
	appSettings,
	path = require('path'),
	merge = require('utils-merge'),
	async = require('async'),
	moment = require('moment'),
	FacebookStrategy = require('passport-facebook').Strategy,
	InstagramStrategy = require('passport-instagram').Strategy,
	TwitterStrategy = require('passport-twitter').Strategy,
	LocalStrategy = require('passport-local').Strategy,
	CoreController,
	CoreMailer;
const mongoose = require('mongoose');

var linkSocialAccount = function (options) {
	logger.silly({options})
	var done = options.donecallback,
		findsocialaccountquery = options.findsocialaccountquery,
		socialaccountattributes = options.socialaccountattributes,
		newaccountdata = options.newaccountdata,
		linkaccountservice = options.linkaccountservice,
		requestobj = options.requestobj;
	User.findOne(findsocialaccountquery,
		function (err, existingUser) {
			logger.silly({ existingUser });
			// console.log({ User });
			if (err) {
				return done(err);
			}
			else if (existingUser) {
				logger.debug('ext - controller/auth.js - already has an account, trying to connect account');
				existingUser.attributes = merge(existingUser.attributes, socialaccountattributes);
				existingUser.markModified('attributes');
				existingUser.save(done);
			}
			else if(requestobj.user){
				mongoose.model('Account').findOne({ _id: requestobj.user._id }, (err, existingAccount) => {
					// console.log({err, existingAccount})
					if (err) {
						return done(err);
					}
					else if (existingAccount) {
						logger.debug('ext - controller/auth.js - already has an account, trying to connect account');
						existingAccount.attributes = merge(existingAccount.attributes, socialaccountattributes);
						existingAccount.markModified('attributes');
						existingAccount.save(done);
					}
					else {
						logger.debug('ext - controller/auth.js - creating new ' + linkaccountservice + ' user');
						newaccountdata.attributes = socialaccountattributes;
						mongoose.model('Account').create(newaccountdata, done);
					}
				});
			}	
			else if (requestobj.user && !requestobj.session) {
				logger.debug('ext - controller/auth.js - already has is logged in, link account requestobj.user', requestobj.user);
				requestobj.user.linkaccount = true;
				requestobj.user.linkaccountservice = linkaccountservice;
				requestobj.user.linkaccountdata = socialaccountattributes;
				done(null, requestobj.user);
			}
			else if (requestobj.user) {
				logger.debug('ext - controller/auth.js - already has is logged in, link account requestobj.user', requestobj.user);
				requestobj.session.linkaccount = true;
				requestobj.session.linkaccountservice = linkaccountservice;
				requestobj.session.linkaccountdata = socialaccountattributes;
				done(null, requestobj.user);
			}
			else {
				logger.debug('ext - controller/auth.js - creating new ' + linkaccountservice + ' user');
				newaccountdata.attributes = socialaccountattributes;
				User.create(newaccountdata, done);
			}
		});
};

var limitLoginAttempts = function (user) {
	user.extensionattributes = user.extensionattributes || {};
	if (!user.extensionattributes.login) {
		user.extensionattributes.login = {
			attempts: 0,
			timestamp: moment(),
			timestamp_date: new Date(),
			flagged: false,
			freezeTime: moment(),
			freezeTime_date: new Date()
		};
	}
	user.extensionattributes.login.attempts++;
	if (!user.extensionattributes.login.flagged) {
		if (moment(user.extensionattributes.login.timestamp).isBefore(moment().subtract(loginExtSettings.timeout.attempt_interval.time, loginExtSettings.timeout.attempt_interval.unit))) {
			user.extensionattributes.login.attempts = 1;
			user.extensionattributes.login.timestamp = moment();
			user.extensionattributes.login.timestamp_date = new Date();
		}
		else if (user.extensionattributes.login.attempts >= loginExtSettings.timeout.attempts && moment(user.extensionattributes.login.timestamp).isAfter(moment().subtract(loginExtSettings.timeout.attempt_interval.time, loginExtSettings.timeout.attempt_interval.unit))) {
			user.extensionattributes.login.flagged = true;
			user.extensionattributes.login.freezeTime = moment();
			user.extensionattributes.login.freezeTime_date = new Date();
		}
	}
	else {
		if (moment(user.extensionattributes.login.freezeTime).isBefore(moment().subtract(loginExtSettings.timeout.freeze_interval.time, loginExtSettings.timeout.freeze_interval.unit))) {
			user.extensionattributes.login.attempts = 1;
			user.extensionattributes.login.timestamp = moment();
			user.extensionattributes.login.timestamp_date = new Date();
			user.extensionattributes.login.flagged = false;
			user.extensionattributes.login.freezeTime = moment();
			user.extensionattributes.login.freezeTime_date = new Date();
		}
	}
	user.markModified('extensionattributes');
	return user;
};

var loginAttemptsError = function (user, done) {
	var templatepath = path.resolve(process.cwd(), loginExtSettings.timeout.view_path_relative_to_periodic);

	var lockout_start_time = moment(user.extensionattributes.login.freezeTime).calendar();
	var lockout_end_time = moment(user.extensionattributes.login.freezeTime).add(loginExtSettings.timeout.freeze_interval.time, loginExtSettings.timeout.freeze_interval.unit).calendar();

	async.waterfall([
		function (cb) {
			var coreMailerOptions = {
				appenvironment: appSettings.application.environment,

				to: user.email,
				replyTo: appSettings.serverfromemail,
				from: appSettings.serverfromemail,
				subject: (appSettings.application.environment !== 'production') ? loginExtSettings.timeout.lockout_email_subject + ' [' + appSettings.application.environment + ']' : loginExtSettings.timeout.lockout_email_subject,
				emailtemplatefilepath: templatepath,
				emailtemplatedata: {
					data: user,
					appname: appSettings.name,
					hostname: appSettings.homepage,
					frozen: {
						starttime: lockout_start_time,
						endtime: lockout_end_time,
					}
				}
			};
			if (loginExtSettings.settings.adminbccemail || appSettings.adminbccemail) {
				coreMailerOptions.bcc = loginExtSettings.settings.adminbccemail || appSettings.adminbccemail;
			}
			CoreMailer.sendEmail(coreMailerOptions, function (err, status) {
				if (err) {
					cb(err, null);
				}
				else {
					cb(null, status);
				}
			});
		}
		// function (status, cb) {
		// 	var emailtrackobject = status,
		// 		emailtracker = {};
		// 	emailtracker.timestamp = new Date();
		// 	emailtracker['Account Access Frozen'] = emailtrackobject;
		// 	User.findByIdAndUpdate(user._id, { $push: { 'attributes.emails' : emailtracker } }, function (err, updated) {
		// 		if (err) {
		// 			cb(err, null);
		// 		}
		// 		else {
		// 			cb(null, updated);
		// 		}
		// 	});
		// }
	], function (err, result) {
		if (err) {
			logger.error('Error sending email', err);
			return done(err);
		}
		else {
			logger.verbose('Sending account lockout email', result);
			return done(new Error(`Your Account is Currently Blocked (until ${lockout_end_time})`), false, {
				message: `Your Account is Currently Blocked (until ${lockout_end_time})`
			});
		}
	});
};

var authenticateUser = function (options) {
	var donecallback = options.donecallback,
		nonusercallback = options.nonusercallback,
		existinusercallback = options.existinusercallback,
		exitinguserquery = options.exitinguserquery,
		limitAttemptUser;
	User.findOne(exitinguserquery, function (err, user) {
		if (err) {
			logger.silly('login error');
			donecallback(err);
		}
		else if (!user) {
			logger.silly('login no user');
			nonusercallback();
		}
		else {
			logger.silly('login found existing user');
			if (loginExtSettings.timeout.use_limiter) {
				limitAttemptUser = limitLoginAttempts(user);
				limitAttemptUser.save(function (err, updated) {
					if (err) {
						logger.error('Error updating user', err);
						donecallback(err);
					}
					else if (loginExtSettings.timeout.use_limiter && updated.extensionattributes.login.flagged) {
						loginAttemptsError(updated, donecallback);
					}
					else {
						existinusercallback(updated);
					}
				});
			}
			else {
				existinusercallback(user);
			}
		}
	});
};

/**
 * uses passport to log users in, calls done(err,user) when complete, can define what credentials to check here
 * @param  {object} req
 * @param  {object} res
 * @return {Function} done(err,user) callback
 */
var usePassport = function () {
	passport.use(new LocalStrategy(function (username, password, done) {
		username = (typeof username === 'string') ? username.replace(/([^\w\d\s])/g, '\\$1') : username;
		authenticateUser({
			exitinguserquery: {
				$or: [{
					username: {
						$regex: new RegExp('^' + username + '$', 'i')
					}
				}, {
					email: {
						$regex: new RegExp('^' + username + '$', 'i')
					}
				}]
			},
			nonusercallback: function () {
				done(null, false, {
					message: 'Unknown user ' + username
				});
			},
			existinusercallback: function (user) {
				if (loginExtSettings && loginExtSettings.settings.usepassword === false) {
					logger.verbose(' skip password usage ');
					done(null, user);
				}
				else {
					user.comparePassword(password, function (err, isMatch) {
						if (err) {
							return done(err);
						}
						if (isMatch) {
							if (user.extensionattributes && user.extensionattributes.login && user.extensionattributes.login.attempts) {
								user.extensionattributes.login.attempts = 0;
								user.markModified('extensionattributes');
								user.save();
							}
							return done(null, user);
						}
						else {
							logger.verbose(' in passport callback with wrong password');
							return done(null, false, {
								message: 'Invalid password',
								login_attempts: (user.extensionattributes && user.extensionattributes.login && user.extensionattributes.login.attempts) ? user.extensionattributes.login.attempts : 0
							});
						}
					});
				}
			},
			donecallback: done
		});
	}));

	if (loginExtSettings && loginExtSettings.passport && loginExtSettings.passport.oauth.facebook && loginExtSettings.passport.oauth.facebook.appid) {
		passport.use(new FacebookStrategy({
				clientID: loginExtSettings.passport.oauth.facebook.appid,
				clientSecret: loginExtSettings.passport.oauth.facebook.appsecret,
				callbackURL: loginExtSettings.passport.oauth.facebook.callbackurl,
				passReqToCallback: true
			},
			function (req, accessToken, refreshToken, profile, done) {
				var facebookdata = profile._json;

				authenticateUser({
					exitinguserquery: {
						email: facebookdata.email,
						'attributes.facebookid': facebookdata.id,
						'attributes.facebookaccesstoken': accessToken.toString()
					},
					existinusercallback: function (user) {
						return done(null, user);
					},
					nonusercallback: function () {
						linkSocialAccount({
							donecallback: done,
							linkaccountservice: 'facebook',
							requestobj: req,
							findsocialaccountquery: {
								email: facebookdata.email,
								'attributes.facebookid': facebookdata.id
							},
							socialaccountattributes: {
								facebookid: facebookdata.id,
								facebookaccesstoken: accessToken,
								facebookusername: facebookdata.username,
								facebookaccesstokenupdated: new Date()
							},
							newaccountdata: {
								email: facebookdata.email,
								activated: true,
								accounttype: 'social-sign-in',
								firstname: facebookdata.first_name,
								lastname: facebookdata.last_name
							}
						});
					},
					donecallback: done
				});
			}));
	}

	if (loginExtSettings && loginExtSettings.passport && loginExtSettings.passport.oauth.instagram && loginExtSettings.passport.oauth.instagram.clientid) {
		passport.use(new InstagramStrategy({
				clientID: loginExtSettings.passport.oauth.instagram.clientid,
				clientSecret: loginExtSettings.passport.oauth.instagram.clientsecret,
				callbackURL: loginExtSettings.passport.oauth.instagram.callbackurl,
				passReqToCallback: true,
			},
			function (req, accessToken, refreshToken, profile, done) {
				// logger.silly('instagram req:',req); 	// logger.silly('instagram accessToken:',accessToken); // logger.silly('instagram refreshToken:',refreshToken); // logger.silly('instagram profile:',profile);

				var instagramdata = profile;
				authenticateUser({
					exitinguserquery: {
						// email: instagramdata.email,
						'attributes.instagramid': instagramdata.id,
						'attributes.instagramaccesstoken': accessToken.toString()
					},
					existinusercallback: function (user) {
						logger.silly('user from instagram passport', user);
						return done(null, user);
					},
					nonusercallback: function () {
						linkSocialAccount({
							donecallback: done,
							linkaccountservice: 'instagram',
							requestobj: req,
							findsocialaccountquery: {
								'attributes.instagramid': instagramdata.id,
							},
							socialaccountattributes: {
								instagramid: instagramdata.id,
								instagramaccesstoken: accessToken,
								instagramusername: instagramdata.username,
								instagramaccesstokenupdated: new Date()
							},
							newaccountdata: {
								email: instagramdata.username + '@instagram.account.com',
								username: instagramdata.username,
								activated: true,
								accounttype: 'social-sign-in',
								firstname: instagramdata.first_name,
								lastname: instagramdata.last_name
							}
						});
					},
					donecallback: done
				});
			}));

	}

	if (loginExtSettings && loginExtSettings.passport && loginExtSettings.passport.oauth.twitter && loginExtSettings.passport.oauth.twitter.consumerKey) {
		passport.use(new TwitterStrategy({
				consumerKey: loginExtSettings.passport.oauth.twitter.consumerKey,
				consumerSecret: loginExtSettings.passport.oauth.twitter.consumerSecret,
				callbackURL: loginExtSettings.passport.oauth.twitter.callbackurl,
				passReqToCallback: true,
			},
			function (req, token, tokenSecret, profile, done) {
				// logger.silly('twitter req:',req); 	// logger.silly('twitter accessToken:',accessToken); // logger.silly('twitter refreshToken:',refreshToken);
				// logger.silly('twitter profile:', profile);

				var twitterdata = profile;
				authenticateUser({
					exitinguserquery: {
						// email: twitterdata.email,
						'attributes.twitterid': twitterdata.id,
						'attributes.twitteraccesstoken': token.toString(),
						'attributes.twitteraccesstokensecret': tokenSecret.toString()
					},
					existinusercallback: function (user) {
						logger.silly('user from twitter passport', user);
						return done(null, user);
					},
					nonusercallback: function () {
						linkSocialAccount({
							donecallback: done,
							linkaccountservice: 'twitter',
							requestobj: req,
							findsocialaccountquery: {
								'attributes.twitterid': twitterdata.id
							},
							socialaccountattributes: {
								twitterid: twitterdata.id,
								twitterusername: twitterdata.username,
								twitteraccesstoken: token,
								twitteraccesstokensecret: tokenSecret,
								twitteraccesstokenupdated: new Date()
							},
							newaccountdata: {
								email: twitterdata.username + '@twitter.account.com',
								username: twitterdata.username,
								activated: true,
								accounttype: 'social-sign-in',
								firstname: twitterdata.name,
							}
						});
					},
					donecallback: done
				});
			}));
	}
};

var serialize = function () {
	/**
	 * store user id in session
	 * @param  {object} req
	 * @param  {object} res
	 * @return {Function} next() callback
	 */
	passport.serializeUser(function (user, done) {
		logger.verbose('controller - auth.js - serialize user');
		done(null, user._id);
	});
};

var deserialize = function () {
	/**
	 * retrieves user data
	 * @param  {object} req
	 * @param  {object} res
	 * @return {Function} next() callback
	 */
	passport.deserializeUser(function (token, done) {
		logger.verbose('controller - auth.js - deserialize user');
		User.findOne({
				_id: token
			})
			.populate('userroles primaryasset')
			.exec(function (err, user) {
				done(err, user);
			});
	});
};

var passportController = function (resources, passportResources) {
	appSettings = resources.settings;
	logger = resources.logger;
	User = passportResources.User;
	passport = passportResources.passport;
	loginExtSettings = passportResources.loginExtSettings;
	CoreController = resources.core.controller;
	CoreMailer = resources.core.extension.mailer;

	return {
		limitLoginAttempts: limitLoginAttempts,
		loginAttemptsError: loginAttemptsError,
		usePassport: usePassport,
		deserialize: deserialize,
		serialize: serialize,
		passport: passport,
		authenticateUser: authenticateUser,
		linkSocialAccount: linkSocialAccount
	};
};

module.exports = passportController;
