'use strict';

var logger,
	User,
	passport,
	loginExtSettings,
	configError;


/**
 * logs user in via facebook oauth2
 * @param  {object} req
 * @param  {object} res
 * @return {Function} next() callback
 */
var facebook = function (req, res, next) {
	if (configError) {
		next(configError);
	}
	else {
		passport.authenticate('facebook', {
			scope: loginExtSettings.passport.oauth.facebook.scope
		})(req, res, next);
	}
};

/**
 * facebook oauth callback
 * @param  {object} req
 * @param  {object} res
 * @return {Function} next() callback
 */
var facebookcallback = function (req, res, next) {
	var loginUrl = (req.session.return_url) ? req.session.return_url : loginExtSettings.settings.authLoggedInHomepage;
	var loginFailureUrl = (req.session.return_url) ? req.session.return_url : loginExtSettings.settings.authLoginPath + '?return_url=' + req.session.return_url;
	passport.authenticate('facebook', {
		successRedirect: loginUrl,
		failureRedirect: loginFailureUrl,
		failureFlash: 'Invalid facebook authentication credentials username or password.'
	})(req, res, next);
};
/**
 * logs user in via instagram oauth2
 * @param  {object} req
 * @param  {object} res
 * @return {Function} next() callback
 */
var instagram = function (req, res, next) {
	if (configError) {
		next(configError);
	}
	else {
		passport.authenticate('instagram', {
			scope: loginExtSettings.passport.oauth.instagram.scope
		})(req, res, next);
	}
};

/**
 * instagram oauth callback
 * @param  {object} req
 * @param  {object} res
 * @return {Function} next() callback
 */
var instagramcallback = function (req, res, next) {
	var loginUrl = (req.session.return_url) ? req.session.return_url : loginExtSettings.settings.authLoggedInHomepage;
	var loginFailureUrl = (req.session.return_url) ? req.session.return_url : loginExtSettings.settings.authLoginPath + '?return_url=' + req.session.return_url;
	passport.authenticate('instagram', {
		successRedirect: loginUrl,
		failureRedirect: loginFailureUrl,
		failureFlash: 'Invalid instagram authentication credentials username or password.'
	})(req, res, next);
};
/**
 * logs user in via twitter oauth2
 * @param  {object} req
 * @param  {object} res
 * @return {Function} next() callback
 */
var twitter = function (req, res, next) {
	if (configError) {
		next(configError);
	}
	else {
		passport.authenticate('twitter', {
			scope: loginExtSettings.passport.oauth.twitter.scope
		})(req, res, next);
	}
};

/**
 * twitter oauth callback
 * @param  {object} req
 * @param  {object} res
 * @return {Function} next() callback
 */
var twittercallback = function (req, res, next) {
	var loginUrl = (req.session.return_url) ? req.session.return_url : loginExtSettings.settings.authLoggedInHomepage;
	var loginFailureUrl = (req.session.return_url) ? req.session.return_url : loginExtSettings.settings.authLoginPath + '?return_url=' + req.session.return_url;
	passport.authenticate('twitter', {
		successRedirect: loginUrl,
		failureRedirect: loginFailureUrl,
		failureFlash: 'Invalid twitter authentication credentials username or password.'
	})(req, res, next);
};

var passportSocialController = function (resources, passportResources, UserModel) {
	logger = resources.logger;
	User = UserModel || passportResources.User;
	passport = passportResources.passport;
	loginExtSettings = passportResources.loginExtSettings;
	return {
		facebook: facebook,
		facebookcallback: facebookcallback,
		instagram: instagram,
		instagramcallback: instagramcallback,
		twitter: twitter,
		twittercallback: twittercallback,
	};
};

module.exports = passportSocialController;
