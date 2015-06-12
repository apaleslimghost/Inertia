Template.project.events({
	'click .project-stopped.project-clickable .project-button-main': function(ev, template) {
		if(!template.editing.get()) {
			var id = Timings().insert({
				owner: Meteor.userId(),
				created: TimeSync.serverTime(),
				projectId: this._id,
			});

			Projects().update(this._id, {$set: {inProgressTimer: id}});
		}
	},

	'click .project-inprogress.project-clickable .project-button-main': function(ev, template) {
		var timing = Timings().findOne(this.inProgressTimer);
		var now = TimeSync.serverTime();
		var time = moment(now).diff(timing.created);

		Timings().update(timing._id, {$set: {
			ended: new Date(now),
			time: time
		}});
		Projects().update(this._id, {$unset: {inProgressTimer: null}});
	},

	
	'click [role=edit]': function(ev, template) {
		template.editing.set(!template.editing.get());
	},

	'click [role=list]': function(ev, template) {
		template.showList.set(!template.showList.get());
	},

	'click [role=delete]': function(ev) {
		ev.stopPropagation();
		if(confirm('Delete ' + this.name + '?')) {
			Projects().remove(this._id);
			Timings().find({projectId: this._id}).forEach(function(t) {
				Timings().remove(t._id);
			});
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
	},

	'blur input': function(ev, template) {
		if(!this._id && !ev.currentTarget.value) {
			template.editing.set(false);
		}
	}
});

Template.project.onCreated(function() {
	this.editing = new ReactiveVar(false);
	this.showList = new ReactiveVar(false);
});

function adjustSize(container, name, time) {
	return function() {
		var fudge = 20;
		var bodySize = parseFloat($('body').css('font-size'));
		var size = container.data('original-size') || parseFloat(container.css('font-size')) / bodySize;
		container.data('original-size', size);
		var nameWidth = name.width();
		var timeWidth = time.length ? time.width() + fudge : 0;
		var containerWidth = container.width();
		if(nameWidth + timeWidth > containerWidth) {
			container.css('font-size', (size * containerWidth / (nameWidth + timeWidth)) + 'rem');
		}
	};
}

Template.project.onRendered(function() {
	var doAdjustSize = adjustSize(this.$('.project-button'), this.$('.project-name'), this.$('.project-time'));
	fontsLoaded(doAdjustSize);

	var that = this;
	this.autorun(function() {
		if(that.editing.get()) {
			requestAnimationFrame(function() {
				that.$('input').focus();
			});
		}
	});
});

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
		return Template.instance().editing.get();
	},

	showList: function() {
		return Template.instance().showList.get();
	},

	notButton: function() {
		return Template.instance().showList.get() || Template.instance().editing.get();
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
		return Timings().find({projectId: this._id}, {sort: {ended: 'desc'}});
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
