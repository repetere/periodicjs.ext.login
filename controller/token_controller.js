'use strict';

var async = require('async'),
  appSettings,
  appenvironment,
  bcrypt = require('bcrypt'),
  CoreController,
  CoreUtilities,
  CoreMailer,
  jwt = require('jsonwebtoken'),
  moment = require('moment'),
  loginExtSettings,
  logger,
  merge = require('utils-merge'),
  mongoose,
  User,
  path = require('path'),
  passport;

var periodic;
const capitalize = require('capitalize');
// Utility Functions
var waterfall = function (array, cb) {
  async.waterfall(array, cb);
};
var encode = function (data) {
  return jwt.sign(data, loginExtSettings.token.secret);
};

var decode = function (data, cb) {
  logger.debug('jwt decode data', data);
  jwt.verify(data, loginExtSettings.token.secret, {}, function (err, decoded_token) {
    if (err) {
      logger.error('Error from JWT.verify', err);
      cb(err);
    }		else {
      cb(null, decoded_token);
    }
  });
};

var hasExpired = function (token_expires_millis) {
  var now = new Date();
  var diff = (now.getTime() - token_expires_millis);
  return diff > 0;
};

var invalidateUserToken = function (req, res, next, cb) {
  let token = req.controllerData.token;
  let UserModel = Object.assign({}, User);
  if (req.body.entitytype) {
    UserModel = mongoose.model(capitalize(req.body.entitytype));
  }
  try {
    if (!token){
			// console.log({ token }, 'req.body', req.body);
      UserModel.findOne({
        'attributes.reset_token_link': req.body.token || req.body.query,
      }, function (err, usr) {
				// console.log({ err, usr });
        if (err) {
          logger.error('error finding the user for invalidate token fn');
          cb(err, null);
        } else if (!usr){
          cb(new Error('Invalid token'));
        } else {
          usr.attributes = Object.assign({}, usr.attributes);
          usr.attributes.reset_token = '';
          usr.attributes.reset_token_link = '';
          usr.attributes.reset_token_expires_millis = 0;
          cb(false, req, res, next, usr);
        }
      });
    }		else {
      UserModel.findOne({
        'attributes.reset_token': token,
      }, function (err, usr) {
				// console.log({ err, usr });
        if (err) {
          logger.error('error finding the user for invalidate token fn');
          cb(err, null);
        } else if (!usr){
          cb(new Error('Invalid token'));
        } else {
          usr.attributes = Object.assign({}, usr.attributes);
          usr.attributes.reset_token = '';
          usr.attributes.reset_token_link = '';
          usr.attributes.reset_token_expires_millis = 0;
          cb(false, req, res, next, usr);
        }
      });
    }
  } catch (e) {
    cb(e);
  }
};

var resetPassword = function (req, res, next, user, cb) {
  var err;
	// console.log('loginExtSettings', loginExtSettings);
	// console.log('req.body', req.body);
  if (req.body.password) {
    var validate = User.checkValidation({
      newuser: req.body,
      checkusername: false,
      checkemail: false,
      checkpassword: true,
      useComplexity: loginExtSettings.complexitySettings.useComplexity,
      complexity: loginExtSettings.complexitySettings.settings.medium,
    });
    if (req.body.password !== req.body.passwordconfirm) {
      err = new Error('Passwords do not match in token');
      req.flash('error', err);
      cb(err, null);
    }		else if (validate !== null) {
      req.flash('error', validate);
      cb(validate, null);
    }		else {
      var salt = bcrypt.genSaltSync(10),
        hash = bcrypt.hashSync(req.body.password, salt);
      user.password = hash;
      cb(null, user, req);
    }
  }	else {
    cb(new Error('Invalid Empty Password'), null);
  }
};

/**
 * description The save user function has two special fn calls on the model to mark the properties on it as changed/modified this gets around some werid edge cases when its being updated in memory but not save in mongo
 *
 */
function saveUser(user, req, cb) {
  user.markModified('attributes');
  user.markModified('password');
  if (user.extensionattributes && user.extensionattributes.login && user.extensionattributes.login.flagged) {
    user.extensionattributes.login.flagged = false;
    user.extensionattributes.login.attempts = 0;
    user.extensionattributes.login.timestamp = moment().subtract(loginExtSettings.timeout.attempt_interval.time, loginExtSettings.timeout.attempt_interval.unit);
    user.markModified('extensionattributes');
  }
  user.save(function (err, usr) {
    if (err) {
      cb(err, null);
    }
    cb(null, usr, req);
  });
}


var getUser = function (req, res, next, cb) {
  if (req.body.entitytype) {
    User = mongoose.model(capitalize(req.body.entitytype));
  }
  User.findOne({
    email: new RegExp('^' + req.body.email + '$', 'i'),
  }, function (err, user) {
    if (err) {
      cb(err, null);
    }		else if (user) {
      cb(false, user, req);
    }		else {
      req.flash('error', 'No user with that email found!');
      cb(new Error('No user with that email found.'), null);
    }
  });
};

var generateToken = function (user, req, cb) {
	//Generate reset token and URL link; also, create expiry for reset token
	//make sure attributes exists || create it via merge
  var salt = bcrypt.genSaltSync(10);
  var now = new Date();
  var expires = new Date(now.getTime() + (loginExtSettings.token.resetTokenExpiresMinutes * 60 * 1000)).getTime();
  user.attributes = user.attributes || {};
  user.attributes.reset_token = encode({
    email: user.email,
    apikey: user.apikey,
  });
  user.attributes.reset_token_link = CoreUtilities.makeNiceName(bcrypt.hashSync(user.attributes.reset_token, salt));
  user.attributes.reset_token_expires_millis = expires;

	//TODO: Look into why mongoose properties 
	//are not being saved during async fn calls
  user.markModified('attributes');
  user.save(function (err) {
    if (err) {
      cb(err, null);
    }
    cb(null, user, req);
  });
};

// create a func for the mail options

var emailForgotPasswordLink = function (user, req, cb) {
  CoreController.getPluginViewDefaultTemplate({
    viewname: 'email/user/forgot_password_link',
    themefileext: appSettings.templatefileextension,
  },
		function (err, templatepath) {
  if (err) {
    cb(err);
  }			else {
				// console.log('emailForgotPasswordLink templatepath', templatepath);
    if (templatepath === 'email/user/forgot_password_link') {
      templatepath = path.resolve(process.cwd(), 'node_modules/periodicjs.ext.login/views', templatepath + '.' + appSettings.templatefileextension);
    }
				// console.log('user for forgot password', user);
    var coreMailerOptions = {
      appenvironment: appenvironment,
      to: user.email,
      from: appSettings.fromemail || appSettings.adminnotificationemail,
      replyTo: appSettings.fromemail || appSettings.adminnotificationemail,
      subject: loginExtSettings.settings.forgotPasswordEmailSubject || appSettings.name + ' - Reset your password',
      emailtemplatefilepath: templatepath,
      emailtemplatedata: {
        user: user,
        appname: appSettings.name,
        hostname: req.headers.host,
        filename: templatepath,
        adminPostRoute: req.adminPostRoute,
      },
    };
    if (loginExtSettings.settings.adminbccemail || appSettings.adminbccemail) {
      coreMailerOptions.bcc = loginExtSettings.settings.adminbccemail || appSettings.adminbccemail;
    }
    CoreMailer.sendEmail(coreMailerOptions, cb);
  }
}
	);
	// cb(null, options);
};

var emailResetPasswordNotification = function (user, req, cb) {
  CoreController.getPluginViewDefaultTemplate({
    viewname: 'email/user/reset_password_notification',
    themefileext: appSettings.templatefileextension,
  },
		function (err, templatepath) {
  if (err) {
    cb(err);
  }			else {
				// console.log('user for forgot password', user);

    if (templatepath === 'email/user/reset_password_notification') {
      templatepath = path.resolve(process.cwd(), 'node_modules/periodicjs.ext.login/views', templatepath + '.' + appSettings.templatefileextension);
    }
    var coreMailerOptions = {
      appenvironment: appenvironment,
      to: user.email,
      from: appSettings.fromemail || appSettings.adminnotificationemail,
      replyTo: appSettings.fromemail || appSettings.adminnotificationemail,
      subject: loginExtSettings.settings.forgotPasswordEmailNotificationSubject || appSettings.name + ' - Password reset notification',
      emailtemplatefilepath: templatepath,
      emailtemplatedata: {
        user: user,
        appname: appSettings.name,
        hostname: req.headers.host,
        filename: templatepath,
      },
    };
    if (loginExtSettings.settings.adminbccemail || appSettings.adminbccemail) {
      coreMailerOptions.bcc = loginExtSettings.settings.adminbccemail || appSettings.adminbccemail;
    }
    CoreMailer.sendEmail(coreMailerOptions, cb);
  }
}
	);
	// cb(null, options);
};

//Post to auth/forgot with the users email
var forgot = function (req, res, next) {
  let adminPostRoute = res.locals.adminPostRoute || 'auth';
  req.adminPostRoute = res.locals.adminPostRoute || 'auth';
	// console.log('res.locals.adminPostRoute',res.locals.adminPostRoute);
	// console.log('req.adminPostRoute',req.adminPostRoute);
  var arr = [
    function (cb) {
      cb(null, req, res, next);
    },
    getUser,
    generateToken,
    emailForgotPasswordLink,
  ];

  waterfall(arr,
		function (err, results) {
  if (periodic.app.controller.extension.reactadmin) {
    if (err) {
      logger.debug('could not send reset email', err);
    } else {
      res.status(200).send({
        result:'success',
        data: 'Password reset instructions were sent to your email address',
      });
    }
  } else { 
    CoreController.respondInKind({
      req: req,
      res: res,
      err: err,
      responseData: results,
      callback: function (req, res /*,responseData*/) {
        if (err) {
						

          req.flash('error', err.message);
          res.redirect('/auth/forgot');
						
        } else {
          req.flash('info', 'Password reset instructions were sent to your email address');
          if (req.controllerData && req.controllerData.sendemailstatus) {
            req.controllerData.password_reset_emailstatus = results;
            next();
          }							else {
            res.redirect(loginExtSettings.settings.authLoginPath);
          }
        }
      },
    });
  }
});
};

var asyncreset = function (req, res) {
  let UserModel = Object.assign({}, User);
  if (req.query.entitytype) {
    UserModel = mongoose.model(capitalize(req.query.entitytype));
  }
  UserModel.findOne({
    'attributes.reset_token_link': req.params.token,
  }, function (err, user_with_token) {
    if (err || !user_with_token) {
      res.status(400).send({
        result: 'error',
        data: {
          error: (err) ? err.toString() : 'Invalid token',
        },
      });
    }		else {
      res.status(200).send({
        result: 'success',
        data: {
          user: {
            email: user_with_token.email,
            username: user_with_token.username,
            firstname: user_with_token.firstname,
            lastname: user_with_token.lastname,
            token: req.params.token,
          },
        },
      });
    }
  });
};

var get_token = function (req, res, next) {
  req.controllerData = (req.controllerData) ? req.controllerData : {};
  if (periodic.app.controller.extension.reactadmin) {
    let reactadmin = periodic.app.controller.extension.reactadmin;
    next();
  } else {
    User.findOne({
      'attributes.reset_token_link': req.params.token,
    }, function (err, user_with_token) {
      if (err) {
        req.flash('error', err.message);
        res.redirect(loginExtSettings.settings.authLoginPath);
      }			else if (!user_with_token || !user_with_token.attributes.reset_token) {
        req.flash('error', 'Invalid reset token');
        res.redirect(loginExtSettings.settings.authLoginPath);
      }			else if (hasExpired(user_with_token.attributes.reset_token_expires_millis)) {
        req.flash('error', 'Password reset token is has expired.');
        res.redirect(loginExtSettings.settings.authLoginPath);
      }			else {
        req.controllerData.token = user_with_token.attributes.reset_token;
        next();
      }
    });
  }
};

//GET if the user token is vaild show the change password page
var reset = function (req, res, next) {
  if (periodic.app.controller.extension.reactadmin) {
    let reactadmin = periodic.app.controller.extension.reactadmin;
		// console.log({ reactadmin });
		// console.log('ensureAuthenticated req.session', req.session);
		// console.log('ensureAuthenticated req.user', req.user);
    next();
  } else {
    let adminPostRoute = res.locals.adminPostRoute || 'auth';
    var token = req.controllerData.token,
			// current_user,
      decode_token;

    decode(token, function (err, decode) {
      if (err) {
        CoreController.handleDocumentQueryErrorResponse({
          err: err,
          res: res,
          req: req,
          errorflash: err.message,
        });
      }			else {
        decode_token = decode;
				//Find the User by their token
        User.findOne({
          'attributes.reset_token': token,
        }, function (err, found_user) {
          if (err || !found_user) {
            req.flash('error', 'Password reset token is invalid.');
            res.redirect(loginExtSettings.settings.authLoginPath);
          }
					// current_user = found_user;
					//Check to make sure token hasn't expired

					//Check to make sure token is valid and sign by us
          else if (found_user.email !== decode_token.email && found_user.api_key !== decode_token.api_key) {
            req.flash('error', 'This token is not valid please try again');
            res.redirect(loginExtSettings.settings.authLoginPath);
          }					else {
            CoreController.getPluginViewDefaultTemplate({
              viewname: 'user/reset',
              themefileext: appSettings.templatefileextension,
              extname: 'periodicjs.ext.login',
            },
							function (err, templatepath) {
  CoreController.handleDocumentQueryRender({
    res: res,
    req: req,
    renderView: templatepath,
    responseData: {
      pagedata: {
        title: 'Reset Password',
        current_user: found_user,
      },
      user: req.user,
      adminPostRoute: adminPostRoute,
    },
  });
});
          }
        });
      }
    });
  }
};	

//POST change the users old password to the new password in the form
var token = function (req, res, next) {
	// console.log('req.body', req.body);
	// console.log('req.params', req.params);
  var user_token = req.params.token || req.body.token; //req.controllerData.token;
  waterfall([
    function (cb) {
      cb(null, req, res, next);
    },
    invalidateUserToken,
    resetPassword,
    saveUser,
    emailResetPasswordNotification,
  ],
		function (err, results) {
  if (periodic.app.controller.extension.reactadmin) {
    let reactadmin = periodic.app.controller.extension.reactadmin;
    if (err) {
      res.status(400).send({
        result: 'error',
        data: {
          error:err.toString(),
        },
      });
    } else {
      res.status(200).send({
        result: 'success',
        data:'Password successfully changed',
      });
    }
  } else { 
				// console.log('These are the err', err);
				// console.log('These are the results', results);
    CoreController.respondInKind({
      req: req,
      res: res,
      err: err,
      responseData: results || {},
      callback: function (req, res /*,responseData*/ ) {
						// console.log('err',err,'/auth/reset/' + user_token);
        if (err) {
							// console.log('return to reset');
          req.flash('error', err.message);
          res.redirect('/auth/reset/' + user_token);
        }						else {
							// console.log('no return to x');
          req.flash('success', 'Password Sucessfully Changed!');
          res.redirect(loginExtSettings.settings.authLoginPath);
        }
      },
    });
  }
});
};

var getTokenExpiresTime = function () {
  var now = new Date();
  return new Date(now.getTime() + (loginExtSettings.token.resetTokenExpiresMinutes * 60 * 1000)).getTime();
};

var update_user_activation_token = function (req, res, next) {
  try {
    if (!req.body.attributes.user_activation_token) {
      throw Error('invalid user activation');
    }		else if (!req.isAuthenticated()) {
      throw Error('must be logged in');
    }
    req.user.attributes = merge(req.user.attributes, req.body.attributes);

    User.findOne({
      '_id': req.user._id,
    }, function (err, user_to_update) {
      if (err) {
        throw err;
      }			else if (!user_to_update || !user_to_update) {
        throw Error('invalid user activation token');
      }			else {
        user_to_update.attributes = req.user.attributes;
        user_to_update.markModified('attributes');
        user_to_update.save(function (err /*, usr */ ) {
          if (err) {
            next(err);
          }					else {
            next();
          }
        });
      }
    });
  }	catch (e) {
    CoreController.handleDocumentQueryErrorResponse({
      err: e,
      res: res,
      req: req,
      errorflash: e.message,
    });
  }
};

var get_user_activation_token = function (req, res, next) {
  req.controllerData = (req.controllerData) ? req.controllerData : {};
  User.findOne({
    'attributes.user_activation_token_link': req.params.token,
  }, function (err, user_with_activation_token) {
		// console.log('user_with_activation_token', user_with_activation_token);
    if (err) {
      req.flash('error', err.message);
      res.redirect(loginExtSettings.settings.authLoginPath);
    }		else if (!user_with_activation_token || !user_with_activation_token.attributes.user_activation_token) {
      req.flash('error', 'Invalid validation token');
      res.redirect(loginExtSettings.settings.authLoginPath);
    }		else if (hasExpired(user_with_activation_token.attributes.reset_activation_expires_millis)) {
      req.flash('error', 'Activation token has expired.');
      res.redirect(loginExtSettings.settings.authLoginPath);
    }		else {
      req.controllerData.user_activation_token = user_with_activation_token.attributes.user_activation_token;
      next();
    }
  });
};

var generate_activation_attributes = function (options, callback) {
  var activationData = options.activationData;

  try {
    if (!activationData.email) {
      throw new Error('you must provide an email address to activate an account');
    }
    var salt = bcrypt.genSaltSync(10),
      expires = getTokenExpiresTime(),
      user_activation_token = encode({
        email: activationData.email,
      });
    activationData.attributes = activationData.attributes || {};
    activationData.attributes.user_activation_token = user_activation_token;
    activationData.attributes.user_activation_token_link = CoreUtilities.makeNiceName(bcrypt.hashSync(activationData.attributes.user_activation_token, salt));
    activationData.attributes.reset_activation_expires_millis = expires;

    callback(null, activationData);
  }	catch (e) {
    callback(e, null);
  }
};

var update_activation_attributes = function (options, callback) {
  try {
    var updatedActivationData = options.updatedActivationData;

    User.findOne({
      '_id': updatedActivationData._id,
    }, function (err, user_to_update) {
      if (err) {
        callback(err);
      }			else if (!user_to_update || !user_to_update) {
        callback(Error('Invalid user activation token'));
      }			else {
        user_to_update.attributes = merge(user_to_update.attributes, updatedActivationData.attributes);
        user_to_update.markModified('attributes');
        user_to_update.save(function (err /*, usr */ ) {
          if (err) {
            callback(err);
          }					else {
            callback(null, user_to_update);
          }
        });
      }
    });
  }	catch (e) {
    callback(e);
  }
};

// auth/user/new
var create_user_activation_token = function (req, res, next) {
  try {
    if (!req.body.email && !req.isAuthenticated()) {
      throw new Error('you must be logged in, to activate your account');
    }
    var userdata = CoreUtilities.removeEmptyObjectValues(req.body),
      salt = bcrypt.genSaltSync(10),
      expires = getTokenExpiresTime(),
      user_activation_token = encode({
        email: userdata.email || req.user.email,
      });
    userdata.attributes = {};
    userdata.attributes.user_activation_token = user_activation_token;
    userdata.attributes.user_activation_token_link = CoreUtilities.makeNiceName(bcrypt.hashSync(userdata.attributes.user_activation_token, salt));
    userdata.attributes.reset_activation_expires_millis = expires;

    req.body = userdata;
    next();
  }	catch (e) {
    CoreController.handleDocumentQueryErrorResponse({
      err: e,
      res: res,
      req: req,
      errorflash: e.message,
    });
  }
};

var tokenController = function (resources, passportResources, UserModel) {
  periodic = resources;
  appSettings = resources.settings;
  CoreController = resources.core.controller;
  CoreUtilities = resources.core.utilities;
  CoreMailer = resources.core.mailer;
  loginExtSettings = passportResources.loginExtSettings;
  logger = resources.logger;
  mongoose = resources.mongoose;
  passport = passportResources.passport;
  User = UserModel || mongoose.model('User');
  appenvironment = appSettings.application.environment;
  return {
    forgot: forgot,
    reset: reset,
    generate_activation_attributes: generate_activation_attributes,
    update_activation_attributes: update_activation_attributes,
    get_user_activation_token: get_user_activation_token,
    get_token: get_token,
    create_user_activation_token: create_user_activation_token,
    update_user_activation_token: update_user_activation_token,
    token: token,
    asyncreset,
  };
};


module.exports = tokenController;
