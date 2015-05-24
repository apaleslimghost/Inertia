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
	}

	return function() {
		return Meteor.user() ? Sync : Local;
	};
}

Projects = HybridCollection('projects');
Timings = HybridCollection('timings');

