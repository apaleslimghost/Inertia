SyncProjects = new Mongo.Collection('projects');
SyncTimings = new Mongo.Collection('timings');

LocalProjects = new Mongo.Collection(null);
LocalTimings = new Mongo.Collection(null);

if(Meteor.isClient) {
	new LocalPersist(LocalProjects, 'projects');
	new LocalPersist(LocalTimings, 'timings');
}

function localOrSync(local, sync) {
	return function() {
		return Meteor.user() ? sync : local;
	};
}

Projects = localOrSync(LocalProjects, SyncProjects);
Timings = localOrSync(LocalTimings, SyncTimings);
