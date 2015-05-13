Template.project.events({
	'click .start': function(ev) {
	
	},

	'click .edit': function(ev, template) {
		template.editing.set(!template.editing.get());
	},

	'keyup input': function(ev, template) {
		if(ev.which === 13) {
			Projects.upsert({_id: this._id}, {$set: {name: ev.currentTarget.value}});
			ev.currentTarget.value = '';
			template.editing.set(false);
		}
	}
});

Template.project.onCreated(function () {
	this.editing = new ReactiveVar(false);
});

Template.project.helpers({
	editing: function() {
		return !this._id || Template.instance().editing.get();
	}
});
