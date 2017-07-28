'use strict';
var Pushie = require('pushie'),
	async = require('async'),
	classie = require('classie'),
	Formie = require('formie'),
	Session_timeout = require('./session_timeout'),
	StylieModals = require('stylie.modals'),
	StylieNotification = require('stylie.notifications'),
	// StylieTable = require('stylie.tables'),
	// StyliePushMenu,
	asyncAdminPushie,
	asyncHTMLWrapper,
	asyncHTMLContentContainer,
	asyncContentSelector = '#ts-asyncadmin-content-container',
	flashMessageArray = [],
	asyncFlashFunctions = [],
	request = require('superagent'),
	mtpms,
	menuElement, ajaxlinks,
	navlinks,
	mobile_nav_menu_overlay,
	mobile_nav_menu,
	menuTriggerElement,
	loginmodalElement,
	session_timeout,
	AdminFormies = {},
	LoginModal,
	nav_header,
	preloaderElement;

var showPreloader = function (element) {
	var plElement = element || preloaderElement;
	classie.remove(plElement, 'hide');
	classie.remove(plElement, 'hide-preloading');
};

var endPreloader = function (element) {
	var plElement = element || preloaderElement;
	classie.add(plElement, 'hide-preloading');
	var t = setTimeout(function () {
		clearTimeout(t);
		classie.add(plElement, 'hide');
	}, 400);
};

var handleUncaughtError = function (e) {
	endPreloader();
	window.showErrorNotificaton({
		message: e.message
	});
};

var preventDefaultClick = function (e) {
	e.preventDefault();
	return;
};

var initFlashMessage = function () {
	window.showFlashNotifications({
		flash_messages: window.periodic_flash_messages,
		ttl: 7000,
		wrapper: document.querySelector('.ts-pushmenu-scroller-inner')
	});
};

window.showPreloader = showPreloader;
window.endPreloader = endPreloader;

var isMobileNavOpen = function () {
	return classie.has(mobile_nav_menu, 'slideOutLeft') || classie.has(mobile_nav_menu, 'initialState');
};

var closeMobileNav = function () {
	classie.add(mobile_nav_menu_overlay, 'hide');
	classie.add(mobile_nav_menu, 'slideOutLeft');
	classie.remove(mobile_nav_menu, 'slideInLeft');
};

var controlMobileNav = function () {
	if (isMobileNavOpen()) {
		classie.remove(mobile_nav_menu, 'initialState');
		classie.add(mobile_nav_menu, 'slideInLeft');
		classie.remove(mobile_nav_menu, 'slideOutLeft');
		classie.remove(mobile_nav_menu_overlay, 'hide');
	}
	else {
		closeMobileNav();
	}
};

var navOverlayClickHandler = function () {
	closeMobileNav();
};

var loadAjaxPage = function (options) {
	closeMobileNav();
	var htmlDivElement = document.createElement('div'),
		newPageTitle,
		newPageContent,
		newJavascripts;
	showPreloader();
	request
		.get(options.datahref)
		.set('Accept', 'text/html')
		.withCredentials()
		.end(function (error, res) {
			// console.log('error', error);
			// console.log('res', res);
			if (error) {
				window.showErrorNotificaton({
					message: error.message
				});
			}
			else if (res.error) {
				window.showErrorNotificaton({
					message: 'Status [' + res.error.status + ']: ' + res.error.message
				});
			}
			else {
				htmlDivElement.innerHTML = res.text;
				newPageContent = htmlDivElement.querySelector('#ts-asyncadmin-content-wrapper');
				newPageTitle = htmlDivElement.querySelector('#menu-header-stylie').innerHTML;
				asyncHTMLWrapper.removeChild(document.querySelector(asyncContentSelector));
				document.querySelector('#menu-header-stylie').innerHTML = newPageTitle;
				asyncHTMLWrapper.innerHTML = newPageContent.innerHTML;

				// console.log('htmlDivElement', htmlDivElement);
				newJavascripts = htmlDivElement.querySelectorAll('script');
				for (var j = 0; j < newJavascripts.length; j++) {
					if (!newJavascripts[j].src.match('/extensions/periodicjs.ext.asyncadmin/js/asyncadmin.min.js')) {
						var newJSScript = document.createElement('script');
						if (newJavascripts[j].src) {
							newJSScript.src = newJavascripts[j].src;
						}
						if (newJavascripts[j].id) {
							newJSScript.id = newJavascripts[j].id;
						}
						if (newJavascripts[j].type) {
							newJSScript.type = newJavascripts[j].type;
						}
						// newJSScript.class = newJavascripts[j].class;
						newJSScript.innerHTML = newJavascripts[j].innerHTML;
						asyncHTMLWrapper.appendChild(newJSScript);
					}
				}
				initFlashMessage();
				if (options.pushState) {
					asyncAdminPushie.pushHistory({
						data: {
							datahref: options.datahref
						},
						title: 'Title:' + options.datahref,
						href: options.datahref
					});
				}
				endPreloader();
			}
		});
};


var defaultAjaxFormie = function (formElement) {
	var _csrfToken = formElement.querySelector('input[name="_csrf"]') || document.querySelector('input[name="_csrf"]');

	return new Formie({
		ajaxformselector: '#' + formElement.getAttribute('id'),
		// headers: {'customheader':'customvalue'},
		postdata: {
			'_csrf': _csrfToken.value,
			format: 'json'
		},
		queryparameters: {
			'_csrf': _csrfToken.value,
			format: 'json'
		},
		beforesubmitcallback: function (beforeEvent, formElement) {
			var beforesubmitFunctionString = formElement.getAttribute('data-beforesubmitfunction'),
				beforefn = window[beforesubmitFunctionString];
			// is object a function?
			if (typeof beforefn === 'function') {
				beforefn(beforeEvent, formElement);
			}
			window.showPreloader();
		},
		successcallback: function (response) {
			if (response.body && response.body.result && response.body.result === 'error') {
				window.showStylieNotification({
					message: response.body.data.error.message || response.body.data.error,
					type: 'error'
				});
			}
			else {
				if (response.body && response.body.result && response.body.result === 'success' && response.body.data.redirecturl) {
					window.location = response.body.data.redirecturl;
				}
				window.showStylieNotification({
					message: 'Successful'
				});
				var successsubmitFunctionString = formElement.getAttribute('data-successsubmitfunction'),
					successfn = window[successsubmitFunctionString];
				// is object a function?
				if (typeof successfn === 'function') {
					successfn(response);
				}
				if (formElement.getAttribute('data-successredirect-href')) {
					var successredirecthref = formElement.getAttribute('data-successredirect-href');
					loadAjaxPage({
						datahref: successredirecthref,
						pushState: true
					});
				}
				else if (formElement.getAttribute('data-hardredirect-href')) {
					window.location = formElement.getAttribute('data-hardredirect-href');
				}
			}
			window.endPreloader();
		},
		errorcallback: function (error, response) {
			// console.log('error', error);
			// console.log('response.response', response.response);
			// console.log('response', response);

			try {
				var errormessage, jsonmessage;
				if (response.body && response.body.error && response.body.error.message) {
					errormessage = response.body.error.message;
				}
				else if (response.body && response.body.result && response.body.result === 'error') {
					errormessage = response.body.data.error.message || response.body.data.error;
				}
				else {
					jsonmessage = JSON.parse(response.response);
					errormessage = jsonmessage;
				}
				window.showErrorNotificaton({
					message: errormessage
				});
			}
			catch (e) {
				if (error.message) {
					window.showErrorNotificaton({
						message: error.message
					});
				}
				else {
					window.showErrorNotificaton({
						message: error
					});
				}
			}

			window.endPreloader();
			var errorsubmitFunctionString = formElement.getAttribute('data-errorsubmitfunction'),
				errorfn = window[errorsubmitFunctionString];
			// is object a function?
			if (typeof errorfn === 'function') {
				errorfn(error, response);
			}
		}
	});
};

var initAjaxFormies = function () {
	var ajaxForm;
	var ajaxforms = document.querySelectorAll('.async-admin-ajax-forms');

	AdminFormies = {};
	//console.log('ajaxforms', ajaxforms);
	try {
		if (ajaxforms && ajaxforms.length > 0) {
			for (var x = 0; x < ajaxforms.length; x++) {
				ajaxForm = ajaxforms[x];
				//ajaxFormies[ajaxForm.getAttribute('name')] = 
				AdminFormies[ajaxForm.id] = defaultAjaxFormie(ajaxForm);
			}
		}

		window.AdminFormies = AdminFormies;
	}
	catch (e) {
		handleUncaughtError(e);
	}
};
// var navlinkclickhandler = function (e) {
// 	var etarget = e.target,
// 		etargethref = etarget.href;

// 	if (classie.has(etarget, 'async-admin-ajax-link')) {
// 		e.preventDefault();
// 		// console.log('etargethref', etargethref);
// 		loadAjaxPage({
// 			datahref: etargethref,
// 			pushState: true
// 		});
// 		// StyliePushMenu._resetMenu();
// 		return false;
// 	}
// };

var statecallback = function (data) {
	// console.log('data', data);
	if (data && data.datahref) {
		loadAjaxPage({
			datahref: data.datahref,
			pushState: false
		});
	}
};
var pushstatecallback = function ( /*data*/ ) {
	// console.log('data', data);
};


window.getAsyncCallback = function (functiondata) {
	return function (asyncCB) {
		new StylieNotification({
			message: functiondata.message,
			ttl: functiondata.ttl,
			wrapper: functiondata.wrapper,
			layout: 'growl',
			effect: 'jelly',
			type: functiondata.type, // notice, warning, error or success
			onClose: function () {
				asyncCB(null, 'shown notification');
			}
		}).show();
	};
};

window.showFlashNotifications = function (options) {
	if (options.flash_messages) {
		for (var x in options.flash_messages) {
			if (options.flash_messages[x]) {
				for (var y in options.flash_messages[x]) {
					flashMessageArray.push({
						type: x,
						message: options.flash_messages[x][y]
					});
					asyncFlashFunctions.push(window.getAsyncCallback({
						type: x,
						ttl: options.ttl,
						message: options.flash_messages[x][y],
						wrapper: options.wrapper
					}));
				}
			}
		}
		if (asyncFlashFunctions.length > 0) {
			async.series(asyncFlashFunctions, function (err /*,result*/ ) {
				if (err) {
					console.error(err);
				}
				else if (options.callback) {
					options.callback();
				}
				// else {
				// 	console.log(result);
				// }
			});
		}
	}
};

window.showErrorNotificaton = function (options) {
	options.layout = 'growl';
	options.effect = 'jelly';
	options.ttl = false;
	options.type = 'error';
	window.showStylieNotification(options);
};

window.showStylieNotification = function (options) {
	new StylieNotification({
		message: options.message,
		ttl: (typeof options.ttl === 'boolean') ? options.ttl : 7000,
		wrapper: options.wrapper || document.querySelector('main'),
		layout: options.layout || 'growl',
		effect: options.effect || 'jelly',
		type: options.type, // notice, warning, error or success
		onClose: options.onClose || function () {}
	}).show();
};

var async_admin_ajax_link_handler = function (e) {
	var etarget = e.target,
		etargethref = etarget.href || etarget.getAttribute('data-ajax-href');

	if (classie.has(etarget, 'async-admin-ajax-link')) {
		e.preventDefault();
		// console.log('etargethref', etargethref);
		loadAjaxPage({
			datahref: etargethref,
			pushState: true
		});
		// StyliePushMenu._resetMenu();
		return false;
	}
};
window.showLoginModal = function (data, title) {
	loginmodalElement.querySelector('#loginmodal-title').innerHTML = title;
	loginmodalElement.querySelector('#loginmodal-content').innerHTML = data;
	LoginModal.show('loginmodal-modal');
};
var init = function () {
	asyncHTMLWrapper = document.querySelector('#ts-asyncadmin-content-wrapper');
	asyncHTMLContentContainer = document.querySelector(asyncContentSelector);
	navlinks = document.querySelector('#ts-pushmenu-mp-menu');
	menuElement = document.getElementById('ts-pushmenu-mp-menu');
	menuTriggerElement = document.getElementById('trigger');
	nav_header = document.querySelector('#nav-header');
	loginmodalElement = document.querySelector('#loginmodal-modal');
	mtpms = document.querySelector('main.ts-pushmenu-scroller');
	ajaxlinks = document.querySelectorAll('.async-admin-ajax-link');
	preloaderElement = document.querySelector('#ts-preloading');
	mobile_nav_menu = document.getElementById('ts-nav-menu');
	mobile_nav_menu_overlay = document.querySelector('.ts-nav-overlay');

	for (var u = 0; u < ajaxlinks.length; u++) {
		ajaxlinks[u].addEventListener('click', preventDefaultClick, false);
	}
	mobile_nav_menu_overlay.addEventListener('click', navOverlayClickHandler, false);
	menuTriggerElement.addEventListener('click', controlMobileNav, false);
	if (mobile_nav_menu) {
		// mobile_nav_menu.addEventListener('mousedown', async_admin_ajax_link_handler, false);
		mobile_nav_menu.addEventListener('click', async_admin_ajax_link_handler, false);
	}
	// if (navlinks) {
	// 	navlinks.addEventListener('mousedown', navlinkclickhandler, false);
	// }
	// StyliePushMenu = new PushMenu({
	// 	el: menuElement,
	// 	trigger: menuTriggerElement,
	// 	type: 'overlap', // 'overlap', // 'cover',
	// 	// position: 'right'
	// });
	asyncAdminPushie = new Pushie({
		replacecallback: pushstatecallback,
		pushcallback: pushstatecallback,
		popcallback: statecallback
	});
	LoginModal = new StylieModals({});
	session_timeout = new Session_timeout();
	window.asyncHTMLWrapper = asyncHTMLWrapper;
	initFlashMessage();
	initAjaxFormies();
	// window.StyliePushMenu = StyliePushMenu;
};

if (typeof window.domLoadEventFired !== 'undefined') {
	init();
}
else {
	window.addEventListener('load', init, false);
}
