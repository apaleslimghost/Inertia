Template.timing.helpers({
	friendlyTime: function() {
		return Chronos.liveMoment(this.ended).fromNow();
	},

	isoTime: function() {
		return this.ended.toISOString();
	},

	formatted: function() {
		return formatInterval(moment.duration(this.time));
	}
});

Template.timing.events({
	'click [role=delete]': function(ev) {
		ev.stopPropagation();

		var time = $('<div>').html(formatInterval(moment.duration(this.time))).text();

		if(confirm('Delete ' + time + ' (' + moment(this.ended).fromNow() + ')?')) {
			Timings().remove(this._id);
		}
	}
});
