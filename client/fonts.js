var fontCbs = [], loaded = false;

function callCbs() {
	fontCbs.forEach(function(fn) { fn() });
	fontCbs = [];
}

fontsLoaded = function(cb) {
	fontCbs.push(cb);
	if(loaded) {
		callCbs();
	}
};

Meteor.Loader.loadJs('//use.typekit.net/pxb5ixw.js', function() {
	Typekit.load({
		active: function() {
			loaded = true;
			callCbs();
		}
	});
});
