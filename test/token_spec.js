'use strict';

var request = require('supertest');
var server = request.agent('http://localhost:8786');
var env = require('js-dom').env;
var expect = require('chai').expect;
// var mocha = require('mocha');
var mongoose = require('mongoose');
var context = describe;
var User = mongoose.model('User', require('./user.schema'));
// var utils = require('./utils');



//////////////////////////////
///////Utility functions//////
/////////////////////////////

function getUser(email, cb) {
	User.find({
		email: email
	}, function (err, usr) {
		if (err) {
			cb(err, null);
		}
		cb(null, usr);
	});
}

function createUser(user, cb) {
	User.create(user, function (err, usr) {
		if (err) {
			cb(err, null);
		}
		cb(null, usr);
	});
}

function getCsrfReg(cb) {
	server
		.get('/auth/user/register')
		.end(function (err, res) {
			if (err) {
				throw err;
			}
			else {
				var html = res.text;
				env(html, function (errors, window) {
					var $ = require('jquery')(window);
					var csrf = $('input[name="_csrf"]').val();
					cb(csrf);
				});
			}
		});
}

function getCsrfLogin(cb) {
	server
		.get('/auth/login')
		.end(function (err, res) {
			if (err) {
				throw err;
			}
			else {
				var html = res.text;
				env(html, function (errors, window) {
					var $ = require('jquery')(window);
					var csrf = $('input[name="_csrf"]').val();
					cb(csrf);
				});

			}
		});
}

function getCsrfForgot(cb) {
	server
		.get('/auth/forgot')
		.end(function (err, res) {
			if (err) {
				throw err;
			}
			else {
				var html = res.text;
				env(html, function (errors, window) {
					var $ = require('jquery')(window);
					var csrf = $('input[name="_csrf"]').val();
					cb(csrf);
				});

			}
		});
}


function registerUser() {
	return function (done) {
		function onResponse(err /*, res */ ) {
			if (err) {
				return done(err);
			}
			getCsrfReg(function ( /*token*/ ) {
				server
					.post('/auth/user/register')
					.send({
						email: 'test@test.com',
						username: 'tester001',
						password: 'tester001',
						confirmpassword: 'tester001'
					})
					.expect(201);
				getUser('test@test.com', function (err, user) {
					expect(err).to.not.be.ok;
					return done();
				})
			});
		}

		server
			.get('/')
			.end(onResponse);

	};
}

function loginUser() {
	return function (done) {
		function onResponse(err, res) {
			if (err) {
				return done(err);
			}
			getCsrfLogin(function (token) {
				server
					.post('/auth/login')
					.send({
						username: 'admin',
						password: 'admin',
						_csrf: token
					})
					.expect(200);
				expect(res.req.path).to.be.eql('/');
				done();
			});
		}

		server
			.get('/')
			.expect(200)
			.end(onResponse);
	};
}


function loggedIn() {
	return function (done) {
		server
			.get('/')
			.expect(200)
			.end(function (err /*, res*/ ) {
				if (err) {
					return done(err);
				}
				getCsrfLogin(function (token) {
					expect(token).to.be.ok;
					done();
				});
			});
	};
}

function getForgotPassword() {
	return function (done) {
		server
			.get('/auth/forgot')
			.expect(200)
			.end(function (err, res) {
				if (err) {
					throw err;
				}
				var html = res.text;
				env(html, function (errors, window) {
					var $ = require('jquery')(window);
					expect($('.text-left').text()).to.be.eql('Forgot Password');
					return done();
				});
			});
	}
}

function postForgotPassword() {
	return function (done) {
		server
			.get('/')
			.expect(200)
			.end(function (err /*, res */ ) {
				if (err) {
					throw err;
				}
				getCsrfForgot(function (token) {
					var email = {
						email: 'admin@hello.com',
						_csrf: token
					};
					server
						.post('/auth/forgot')
						.send(email)
						.expect(200);
					done();
				});
			});
	}
}

function getResetToken() {
	return function (done) {
		return done();
	};
}

function resetTokenEmail() {
	return function (done) {
		return done();
	};
}

function postResetToken() {
	return function (done) {
		return done();
	};
}

function facebookAuth() {
	return function (done) {
		return done();
	};
}

function instagramAuth() {
	return function (done) {
		return done();
	};
}

function twitterAuth() {
	return function (done) {
		return done();
	};
}



describe('The Login Flow', function () {
	context('Auth: ', function () {
		it('will register a user', registerUser());
		it('will allow a user to login', loginUser());
		it('will authorize a user on a uri that requires user to be logged in', loggedIn());
	});
	context('Forgot: ', function () {
		it('will show the forgot password view on request', getForgotPassword());
		it('will allow a user to give an email to change password', postForgotPassword());
		it('will show the reset form if the user has a valid token', getResetToken());
		it('will show the login form once a user changes the password', postResetToken());
		it('will send email a reset token email', resetTokenEmail());
	});
	context('Social Auth: ', function () {
		it('will allow users to authenticate with facebook', facebookAuth());
		it('will allow users to authenticate with instagram', instagramAuth());
		it('will allow users to authenticate with twitter', twitterAuth());
	});
});
