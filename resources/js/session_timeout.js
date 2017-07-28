'use strict';

var request = require('superagent'),
	merge = require('utils-merge'),
	classie = require('classie'),
	loginmodalElement,
	session_timeout_interval,
	timeoutWarning;

var session_timeout = function (configoptions) {
	var options = {
		modal_selector: '#loginmodal-modal',
		button_container_selector: '#ts-main-div',
		timeout_warning_text: '<p class="ts-text-md">Your session is about to expire, do you wish to continue?</p>',
		session_timeout_title: 'Are you still working?',
		login_timouet_title: 'Logout Warning',
		continue_session_url: '/healthcheck'
	};

	this.options = merge(options, configoptions);
	this.init();
};

session_timeout.prototype.refresh_session_check = function () {
	var _this = this;
	try {
		request
			.get(_this.options.continue_session_url)
			.set('Accept', 'application/json')
			.withCredentials()
			.end(function (error, res) {
				if (error) {
					window.showStylieNotification({
						message: error.message,
						type: 'error'
					});
				}
				else if (res.error) {
					window.showStylieNotification({
						message: 'Status [' + res.error.status + ']: ' + res.error.message,
						type: 'error'
					});
				}
				else {
					clearInterval(session_timeout_interval);
					_this.startSessionTimeoutCountner();
				}
			});
	}
	catch (ajaxPageError) {
		window.showStylieNotification({
			message: 'Sorry, there was an error logging in.  If this error persists please <a href="/contact" style="color:black;">contact us</a>.',
			type: 'error',
			ttl: 60000
		});
	}
};

session_timeout.prototype.startSessionTimeoutCountner = function () {
	clearTimeout(timeoutWarning);
	clearInterval(session_timeout_interval);
	var _this = this;
	var session_ttl = window.session_ttl;
	var sessionTimeout = (session_ttl && session_ttl > 120) ? session_ttl : 120;
	var timeoutdelay = (sessionTimeout - 119) * 1000;
	var secondsLeft = 120;
	var modalTitle = (window.session_form_submit) ? _this.options.session_timeout_title : _this.options.login_timouet_title;
	// var modalText = (window.session_form_submit)?'':'';
	timeoutWarning = setTimeout(function () {
		_this.startSessionCountdown();
		window.showLoginModal('<div id="loginmodal-content">' +
			_this.options.timeout_warning_text +
			'<div class="ts-text-center">' +
			' <span class="ts-button ts-continue-session-button primary-btn ts-modal-close">Continue</span> ' +
			' <a href="/auth/logout" class="ts-button primary-btn ts-button-divider-text-color">Log out (<span id="ts-login-timeout-counter">' + secondsLeft + '</span>)</i></a>' +
			'</div>' +
			'</div>', modalTitle);
		// session_timeout_interval
		clearTimeout(timeoutWarning);
	}, timeoutdelay);
	// console.log('timeoutdelay', timeoutdelay);
};


session_timeout.prototype.startSessionCountdown = function () {
	var secondsLeft = 119;
	var countdownelement = document.querySelector('#ts-login-timeout-counter');
	session_timeout_interval = setInterval(function () {
		if (secondsLeft === 0) {
			clearInterval(session_timeout_interval);
			window.showStylieNotification({
				message: 'Your session has expired due to inactivity.',
				type: 'error',
				ttl: false
			});
		}
		else {
			if (!countdownelement) {
				countdownelement = document.querySelector('#ts-login-timeout-counter');
			}
			secondsLeft--;
			if (countdownelement) {
				countdownelement.innerHTML = secondsLeft;
			}
		}
	}, 1000);
};

session_timeout.prototype.loginSessionClickContainer = function (e) {
	var etarget = e.target;
	var _this = this;

	if (classie.has(etarget, 'ts-continue-session-button')) {
		_this.refresh_session_check();
	}
};


session_timeout.prototype.init = function () {
	var _this = this;
	var session_click_continue_container = document.querySelector(_this.options.button_container_selector);
	loginmodalElement = document.querySelector(_this.options.modal_selector);
	session_click_continue_container.addEventListener('click', function (e) {
		_this.loginSessionClickContainer(e);
	}, false);
	if (window.use_session_timeout) {
		_this.startSessionTimeoutCountner();
	}
};

module.exports = session_timeout;
