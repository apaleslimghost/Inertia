_ = lodash;

formatInterval = function formatInterval(ival) {
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


