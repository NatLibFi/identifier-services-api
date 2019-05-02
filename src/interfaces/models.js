import {Schema} from 'mongoose';

export const UserModel = new Schema(
	{
		id: {
			type: String,
			required: true,
			unique: true
		},
		preference: {
			type: String,
			default: 'English'
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
