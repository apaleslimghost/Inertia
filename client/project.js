Template.project.events({
	'click .start': function(ev, template) {
		template.started.set(new Date);
	},

	'click .stop': function(ev, template) {
		var time = moment().diff(template.started.get());
		Timings.insert({
			projectId: this.id,
			time: time,
			created: new Date
		});

		template.started.set(null);
	},

	'click .edit': function(ev, template) {
		template.editing.set(!template.editing.get());
	},
	
	'click .delete': function() {
		if(confirm('Delete ' + this.name + '?')) {
			Projects.remove({_id: this._id});
		}
	},

	'keyup input': function(ev, template) {
		if(ev.which === 13) {
			Projects.upsert({_id: this._id}, {
				$set: {
					name: ev.currentTarget.value,
					updated: new Date
				},
				$setOnInsert: {
					created: new Date
				}
			});
			ev.currentTarget.value = '';
			template.editing.set(false);
		}
	}
});

Template.project.onCreated(function () {
	this.editing = new ReactiveVar(false);
	this.started = new ReactiveVar(null);
});

Template.project.helpers({
	editing: function() {
		return !this._id || Template.instance().editing.get();
	},

	timeElapsed: function() {
		var started = Template.instance().started.get();
		if(started) {
			var diff = moment.duration(Chronos.liveMoment().diff(started))
			return _.compact([
				diff.hours() && _.padLeft(diff.hours(), 2, '0'),
				diff.minutes() || '0',
				diff.hours() ? false : _.padLeft(diff.seconds(), 2, '0')
			]).join(':');
		}
	},

	timings: function() {
		return Timings.find({projectId: this._id});
	}
});
