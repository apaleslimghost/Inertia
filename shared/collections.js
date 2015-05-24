function HybridCollection(name) {
	var Sync =  new Meteor.Collection(name);
	var Local = new Meteor.Collection(null);

	if(Meteor.isClient) {
		new LocalPersist(Local, name);
	}

	if(Meteor.isServer) {
		Meteor.publish(name, function() {
			return Sync.find({owner: this.userId});
		});

		Sync.allow({
			insert: function (userId, doc) {
				return (userId && doc.owner === userId);
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

