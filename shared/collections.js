var syncCollections = {};
var localCollections = {};

//TODO: this is stupid
upsert = function upsert(collection, selector, doc, cb) {
	if(collection.findOne(selector)) {
		collection.update(selector, doc.$set, cb);
	} else {
		var set = _.extend(doc.$set, doc.$setOnInsert);
		collection.insert(set, cb);
	}
}

function HybridCollection(name) {
	var Sync  = syncCollections[name]  = new Meteor.Collection(name);
	var Local = localCollections[name] = new Meteor.Collection(null);

	if(Meteor.isClient) {
		new LocalPersist(Local, name);
		Tracker.autorun(function() {
			Meteor.subscribe(name);
		});
	}

	if(Meteor.isServer) {
		Meteor.publish(name, function() {
			return Sync.find({owner: this.userId});
		});

		Sync.before.insert(function(userId, doc) {
			doc.created = new Date;
			doc.owner = userId;
		});

		Sync.before.update(function(userId, doc, fields, modifier) {
			modifier.$set = modifier.$set || {};
			modifier.$set.updated = new Date;
		});

		Sync.allow({
			insert: function (userId, doc) {
				return (!doc.owner || doc.owner === userId);
			},
			update: function (userId, doc, fields, modifier) {
				return doc.owner === userId;
			},
			remove: function (userId, doc) {
				return doc.owner === userId;
			},
			fetch: ['owner']
		});

		Sync.deny({
			update: function (userId, docs, fields, modifier) {
				return _.contains(fields, 'owner');
			}
		});
	}

	return function() {
		return Meteor.user() ? Sync : Local;
	};
}

Projects = HybridCollection('projects');
Timings = HybridCollection('timings');

if(Meteor.isServer) {
	Accounts.onCreateUser(function(options, user) {
		if(options.profile) {
			user.profile = options.profile;
		}

		user.newlyCreated = true;

		return user;
	});

	Meteor.publish("userdata", function () {
		if (this.userId) {
			return Meteor.users.find({_id: this.userId}, {fields: {'newlyCreated': 1}});
		} else {
			this.ready();
		}
	});
}

if(Meteor.isClient) {
	Tracker.autorun(function() {
		Meteor.subscribe('userdata');
	});

	Accounts.onLogin(function() {
		if(Meteor.user().newlyCreated) {
			//TODO: this will eat data
			Object.keys(localCollections).forEach(function(col) {
				var Local = localCollections[col];
				var Sync  = syncCollections[col];
				Local.find().forEach(function(doc) {
					upsert(Sync, doc._id, {
						$set: _.omit(doc, 'owner'),
						$setOnInsert: {
							owner: Meteor.userId()
						}
					}, function(err) {
						if(err) throw err;
						Local.remove({});
					});
				});
			});

			Meteor.users.update(Meteor.userId(), {
				$unset: {newlyCreated: ''}
			});
		}
	});
}
