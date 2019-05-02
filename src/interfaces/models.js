import {Schema} from 'mongoose';

export const MessageTemplateModel = new Schema(
	{
		id: {
			type: String,
			required: true,
			unique: true
		},
		lastUpdated: {
			type: Object,
			timestamp: {
				type: String,
				required: true
			},
			user: {
				type: String,
				required: true
			}
		},
		name: {
			type: String,
			required: true
		},
		language: {
			type: String,
			required: true
		},
		subject: {
			type: String,
			required: true
		},
		body: {
			type: String,
			required: true
		}
	},
	{strict: 'throw'}
);

export const UserModel = new Schema(
	{
		id: {
			type: String,
			required: true,
			unique: true
		},
		preferences: {
			type: Object,
			defaultLanguage: {
				type: String,
				required: true,
				default: 'English'
			}
		}
	},
	{strict: 'throw'}
);

export const PublisherModel = new Schema(
	{
		id: {type: String, required: true, unique: true},
		lastUpdated: {
			type: Object,
			timestamp: {
				type: String,
				required: true
			},
			user: {
				type: String,
				required: true
			}
		},
		name: {
			type: String,
			required: true
		},
		language: {
			type: String,
			required: true
		},
		metadataDelivery: {
			type: String,
			enmu: [String]
		},
		activity: {
			type: Object,
			active: {
				type: Boolean,
				default: true,
				required: true
			},
			yearInactivated: {
				type: Number,
				required: false
			}
		},
		streetAddress: {
			type: Object,
			address: {
				type: String,
				required: true
			},
			city: {
				type: String,
				required: true
			},
			zip: {
				type: String,
				required: true
			}
		},
		email: {
			type: String,
			lowercase: true,
			required: true,
			match: [/\S+@\S+\.\S+/, 'is invalid']
		},
		website: {
			type: String,
			required: true
		}
	},
	{strict: 'throw'}
);
