'use strict';
module.exports = {
	settings: {
		authLoginPath: '/auth/login',
		authLogoutPath: '/',
		authLoggedInHomepage: '/p-admin',
		usepassword: true,
		requireusername: true,
		requireuseractivation: true,
		requireemail: true,
		disablesocialsignin: true,
		invalid_activation_token_message: 'invalid activation token'
	},
	new_user_validation: {
		checkusername: true,
		checkpassword: true,
		length_of_username: 4,
		length_of_password: 8,
		send_new_user_email: true
	},
	passport: {
		oauth: {
			facebook: {
				appid: 'NEEDFBAPPID',
				appsecret: 'NEEDFBAPPSECRET',
				callbackurl: 'http://local.getperiodic.com:8786/auth/facebook/callback',
				scope: ['email', 'publish_actions', 'offline_access', 'user_status', 'user_likes', 'user_checkins', 'user_about_me', 'read_stream']
			}
		}
	},
	token: {
		ttl: '3600000',
		resetTokenExpiresMinutes: '60',
		secret: 'periodicjs'
	},
	timeout: {
		view_path_relative_to_periodic: 'node_modules/periodicjs.ext.login/views/email/user/timeout_warning.ejs',
		lockout_email_subject: 'User Account Lockout Notification',
		attempts: 10,
		attempt_interval: {
			time: 5,
			unit: 'minutes'
		},
		freeze_interval: {
			time: 1,
			unit: 'hours'
		},
		use_limiter: true
	},
	routes: {
		forgot_password: {
			default: 'forgot'
		}
	},
	login_csrf: false,
	login_social_buttons: {
		facebook: true,
		instagram: true,
		twitter: true
	},
	complexitySettings: {
		useComplexity: true,
		settings: {
			weak: {
				uppercase: 1,
				lowercase: 1,
				min: 8
			},
			medium: {
				uppercase: 1,
				lowercase: 1,
				digit: 1,
				min: 8
			},
			strong: {
				uppercase: 1,
				lowercase: 1,
				digit: 1,
				special: 1,
				min: 8
			}
		}
	}
};
