Template.projects.helpers({
	projects: function() {
		return Projects.find({});
	}
});

Template.projects.events({
	'keyup [name="newproject"]': function(ev) {
		if(ev.which === 13) {
			Projects.insert({name: ev.currentTarget.value});
			ev.currentTarget.value = '';
		}
	}
});
