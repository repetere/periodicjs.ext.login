'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

var userSchema = new Schema({
	id: ObjectId,
	email: {
		type: String,
		index: {
			unique: true,
			sparse: false
		}
	},
	username: {
		type: String,
		index: {
			unique: true,
			sparse: true
		}
	},
	password: String,
	createdat: {
		type: Date,
		'default': Date.now
	},
	updatedat: {
		type: Date,
		'default': Date.now
	},
	accounttype: {
		type: String,
		'default': 'basic'
	},
	attributes: Schema.Types.Mixed,
	extensionattributes: Schema.Types.Mixed
});
exports = module.exports = userSchema;
