

Template.project.events({
	'click .project-stopped': function(ev, template) {
		if(!template.editing.get()) {
			template.started.set(new Date);
		}
	},

	'click .project-inprogress': function(ev, template) {
		var time = moment().diff(template.started.get());
		Timings.insert({
			projectId: this._id,
			time: time,
			created: new Date
		});

		template.started.set(null);
	},

	'click .edit': function(ev, template) {
		template.editing.set(!template.editing.get());
	},
	
	'click .delete': function(ev) {
		ev.stopPropagation();
		if(confirm('Delete ' + this.name + '?')) {
			Projects.remove({_id: this._id});
		}
	},

	'keyup input': function(ev, template) {
		if(ev.which === 13) {
			Projects.upsert({_id: this._id}, {
				$set: {
					name: ev.currentTarget.value,
					updated: new Date,
					colour: createColour(ev.currentTarget.value)
				},
				$setOnInsert: {
					created: new Date
				}
			});
			ev.currentTarget.value = '';
			ev.currentTarget.blur();
			template.editing.set(false);
		}
	}
});

Template.project.onCreated(function() {
	this.editing = new ReactiveVar(false);
	this.started = new ReactiveVar(null);
});

function adjustSize(container, name, time) {
	return function() {
		if(20 + name.width() + time.width() > container.width()) {
			container.css('font-size', (3 * container.width() / (name.width() + time.width() + 20)) + 'rem');
		}
	};
}

Template.project.onRendered(function() {
	var doAdjustSize = adjustSize(this.$('.project'), this.$('.project-name'), this.$('.project-time'));
	fontsLoaded(doAdjustSize);
});

function formatInterval(ival) {
	return _.compact([
		ival.hours() && _.padLeft(ival.hours(), 2, '0'),
		ival.minutes() || '0',
		ival.hours() ? false : _.padLeft(ival.seconds(), 2, '0')
	]).join(':').split('').map(function(c) {
		return '<span class="timechar' + (c === ':' ? ' timecolon' : '') + '">' + c + '</span>';
	}).join('');
}

function hash(name) {
	return [].reduce.call(name, function(hash, chr) {
		return ((hash << 5) - hash) + chr.charCodeAt(0);
	}, 0);
}

function createColour(name) {
	return tinycolor({
		h: ((hash(name) * 137.5) % 360 + 360) % 360,
		s: .75,
		l: .6
	}).toHexString();
}

Template.project.helpers({
	editing: function() {
		return !this._id || Template.instance().editing.get();
	},

	timeElapsed: function() {
		var started = Template.instance().started.get();
		if(started) {
			return formatInterval(moment.duration(Chronos.liveMoment().diff(started)));
		}
	},

	inProgress: function() {
		return !!Template.instance().started.get();
	},

	timings: function() {
		return Timings.find({projectId: this._id});
	},

	total: function() {
		return formatInterval(Timings.find({projectId: this._id}).fetch().reduce(function(total, timing) {
			return total.add(timing.time, 'ms');
		}, moment.duration(0)));
	},
	
	baseColour: function() {
		var baseColour = tinycolor(this.colour);
		return baseColour.toHexString();
	},
	
	darkColour1: function() {
		var baseColour = tinycolor(this.colour);
		return baseColour.darken(10).toHexString();
	},

	darkColour2: function() {
		var baseColour = tinycolor(this.colour);
		return baseColour.darken(20).toHexString();
	},

	textColour: function() {
		return tinycolor.mostReadable(this.colour, ['white', 'black']).toHexString();
	}
});
