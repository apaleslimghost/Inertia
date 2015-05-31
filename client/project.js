Template.project.events({
	'click .project-stopped': function(ev, template) {
		if(!template.editing.get()) {
			var id = Timings().insert({
				owner: Meteor.userId(),
				projectId: this._id,
			});

			Projects().update(this._id, {$set: {inProgressTimer: id}});
		}
	},

	'click .project-inprogress': function(ev, template) {
		var timing = Timings().findOne(this.inProgressTimer);
		var now = TimeSync.serverTime();
		var time = moment(now).diff(timing.created);

		Timings().update(timing._id, {$set: {
			ended: new Date(now),
			time: time
		}});
		Projects().update(this._id, {$unset: {inProgressTimer: null}});
	},

	'click .edit': function(ev, template) {
		template.editing.set(!template.editing.get());
	},
	
	'click .delete': function(ev) {
		ev.stopPropagation();
		if(confirm('Delete ' + this.name + '?')) {
			Projects().remove(this._id);
		}
	},

	'keyup input': function(ev, template) {
		if(ev.which === 13) {
			var current = Projects().findOne({name: ev.currentTarget.value});
			if(current) {
				$('.project-' + current._id).transition({scale: 1.05}, 50, function() {
					$('.project-' + current._id).transition({scale: 1}, 100);
				});

				return;
			}

			upsert(Projects(), this._id, {
				$set: {
					name: ev.currentTarget.value,
					colour: createColour(ev.currentTarget.value)
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
});

function adjustSize(container, name, time) {
	return function() {
		var fudge = 20;
		if(fudge + name.width() + time.width() > container.width()) {
			container.css('font-size', (3 * container.width() / (name.width() + time.width() + fudge)) + 'rem');
		}
	};
}

Template.project.onRendered(function() {
	var doAdjustSize = adjustSize(this.$('.project-button'), this.$('.project-name'), this.$('.project-time'));
	fontsLoaded(doAdjustSize);
});

function formatInterval(ival) {
	return _.compact([
		ival.hours() && _.padLeft(ival.hours(), 2, '0'),
		ival.minutes() || '0',
		ival.hours() ? false : _.padLeft(ival.seconds(), 2, '0') + 's'
	]).join(':').split('').map(function(c) {
		var extra = c === ':'? 'timecolon'
		          : c === 's'? 'timesecond'
		          : '';
		return '<span class="timechar ' + extra + '">' + c + '</span>';
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
		var timing = this.inProgressTimer && Timings().findOne(this.inProgressTimer);
		if(timing) {
			var now = moment(TimeSync.serverTime());
			return formatInterval(moment.duration(now.diff(timing.created)));
		}
	},

	inProgress: function() {
		return !!this.inProgressTimer;
	},

	timings: function() {
		return Timings().find({projectId: this._id});
	},

	total: function() {
		return formatInterval(Timings().find({projectId: this._id}).fetch().reduce(function(total, timing) {
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

	activeColour: function() {
		var baseColour = tinycolor(this.colour);
		return baseColour.saturate(20).toHexString();
	},

	textColour: function() {
		return tinycolor.mostReadable(this.colour, ['white', 'black']).toHexString();
	}
});
