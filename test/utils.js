'use-strict';
var mongoose = require('mongoose');
var dbURI = 'mongodb://localhost/periodic-test'

process.env.NODE_ENV = 'test';

before(function (done) {

	function clearCollections() {
		for (var collection in mongoose.connection.collections) {
			mongoose.connection.collections[collection].remove(function () {});
		}
		return done();
	}

	if (mongoose.connection.readyState === 0) {
		mongoose.connect(dbURI, function (err) {
			if (err) throw err;
			return clearCollections();
		});
	}
	else {
		return clearCollections();
	}
});

after(function (done) {
	mongoose.disconnect();
	return done();
});
