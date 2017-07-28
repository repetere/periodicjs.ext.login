'use strict';

var path = require('path'),
	fs = require('fs-extra'),
	extend = require('utils-merge'),
	stylietreeview = require('stylie.treeview'),
	csrf = require('csurf'),
	loginExtSettings,
	appenvironment,
	settingJSON,
	loginExtSettingsFile = path.join(__dirname, '../../content/config/extensions/periodicjs.ext.login/settings.json'),
	defaultExtSettings = require('./controller/default_config');

/**
 * An authentication extension that uses passport to authenticate user sessions.
 * @{@link https://github.com/typesettin/periodicjs.ext.login}
 * @author Yaw Joseph Etse
 * @copyright Copyright (c) 2014 Typesettin. All rights reserved.
 * @license MIT
 * @exports periodicjs.ext.login
 * @requires module:passport
 * @param  {object} periodic variable injection of resources from current periodic instance
 */
module.exports = function (periodic) {
	// periodic = express,app,logger,config,db,mongoose
	//console.log('before defaultExtSettings', defaultExtSettings);
	periodic.app.locals.stylietreeview = stylietreeview;
	periodic.app.locals.session_ttl = periodic.settings.sessions.ttl_in_seconds;

	appenvironment = periodic.settings.application.environment;
	settingJSON = fs.readJsonSync(loginExtSettingsFile);
	//console.log('before settingJSON[appenvironment]', settingJSON[appenvironment]);
	loginExtSettings = (settingJSON[appenvironment]) ? extend(defaultExtSettings, settingJSON[appenvironment]) : defaultExtSettings;
	//console.log('after defaultExtSettings', defaultExtSettings);
	//console.log('after settingJSON[appenvironment]', settingJSON[appenvironment]);

	periodic.app.controller.extension.login = {
		loginExtSettings: loginExtSettings
	};

	periodic.app.locals.login_social_buttons = periodic.app.controller.extension.login.loginExtSettings.login_social_buttons;
	periodic.app.controller.extension.login.auth = require('./controller/auth')(periodic);
	periodic.app.controller.extension.login.user = require('./controller/user')(periodic);

	var passport = periodic.app.controller.extension.login.auth.passport,
		authRouter = periodic.express.Router(),
		authController = periodic.app.controller.extension.login.auth,
		userRouter = periodic.express.Router(),
		userController = periodic.app.controller.extension.login.user,
		socialPassportController = require('./controller/social_controller')(periodic, {
			passport: passport,
			loginExtSettings: periodic.app.controller.extension.login.auth.loginExtSettings
		}),
		tokenController = require('./controller/token_controller')(periodic, {
				passport: passport,
				loginExtSettings: periodic.app.controller.extension.login.auth.loginExtSettings
			},
			periodic.app.controller.extension.login.auth.User);
	periodic.app.controller.extension.login.token = tokenController;
	periodic.app.controller.extension.login.social = socialPassportController;

	if (periodic.app.controller.extension.login.loginExtSettings.login_csrf) {
		authRouter.use(csrf());
		userRouter.use(csrf());
		authRouter.use(function (req, res, next) {
			res.locals.token = req.csrfToken();
			next();
		});
		userRouter.use(function (req, res, next) {
			res.locals.token = req.csrfToken();
			next();
		});
	}

	authRouter.get('*', global.CoreCache.disableCache);
	authRouter.post('*', global.CoreCache.disableCache);
	userRouter.get('*', global.CoreCache.disableCache);
	userRouter.post('*', global.CoreCache.disableCache);

	authRouter.get('/login', userController.login);
	authRouter.post('/login', authController.login);
	authRouter.get('/logout', authController.logout);
	//token controller & router
	authRouter.get('/' + loginExtSettings.routes.forgot_password.default, userController.forgot);
	authRouter.post('/' + loginExtSettings.routes.forgot_password.default, tokenController.forgot);
	authRouter.get('/reset/:token', tokenController.get_token, tokenController.reset);
	authRouter.get('/asyncreset/:token', tokenController.get_token, tokenController.asyncreset);
	authRouter.post('/reset/:token', tokenController.get_token, tokenController.token);

	// activate_middleware = [tokenController.get_user_activation_token,authController.ensureAuthenticated];

	// if they have token then render page otherwise
	userRouter.get('/activate/', tokenController.create_user_activation_token, tokenController.update_user_activation_token, authController.get_activation);
	userRouter.post('/activate', authController.activate_user);

	//social controller & router
	authRouter.get('/facebook', socialPassportController.facebook);
	authRouter.get('/facebook/callback', socialPassportController.facebookcallback);
	authRouter.get('/instagram', socialPassportController.instagram);
	authRouter.get('/instagram/callback', socialPassportController.instagramcallback);
	authRouter.get('/twitter', socialPassportController.twitter);
	authRouter.get('/twitter/callback', socialPassportController.twittercallback);

	userRouter.get('/new|/register', userController.newuser);
	userRouter.get('/finishregistration', authController.ensureAuthenticated, userController.finishregistration);

	userRouter.post('/new', tokenController.create_user_activation_token, userController.create);
	userRouter.post('/finishregistration', authController.ensureAuthenticated, userController.updateuserregistration);

	periodic.app.use(authController.rememberme);
	periodic.app.use(passport.initialize());
	periodic.app.use(passport.session());
	periodic.app.use('/auth', authRouter);
	periodic.app.use('/auth/user', userRouter);
	return periodic;
};
