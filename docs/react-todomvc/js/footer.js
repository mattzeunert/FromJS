'use strict';

/*jshint quotmark:false */
/*jshint white:false */
/*jshint trailing:false */
/*jshint newcap:false */
/*global React */

var app = f__useValue((f__setCachedValue(app), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__makeObject([]);

(function () {
	'use strict';

	f__assign(app, f__StringLiteral('TodoFooter'), React.createClass(f__makeObject([['ObjectProperty', f__StringLiteral('displayName'), f__StringLiteral('TodoFooter')], ['ObjectProperty', f__StringLiteral('render'), function render() {
		var activeTodoWord = app.Utils.pluralize(this.props.count, f__StringLiteral('item'));
		var clearButton = null;

		if (f__useValue(this.props.completedCount > 0)) {
			clearButton = React.createElement(f__StringLiteral('button'), f__makeObject([['ObjectProperty', f__StringLiteral('className'), f__StringLiteral('clear-completed')], ['ObjectProperty', f__StringLiteral('onClick'), this.props.onClearCompleted]]), f__StringLiteral('Clear completed'));
		}

		var nowShowing = this.props.nowShowing;
		return React.createElement(f__StringLiteral('footer'), f__makeObject([['ObjectProperty', f__StringLiteral('className'), f__StringLiteral('footer')]]), React.createElement(f__StringLiteral('span'), f__makeObject([['ObjectProperty', f__StringLiteral('className'), f__StringLiteral('todo-count')]]), React.createElement(f__StringLiteral('strong'), null, this.props.count), f__StringLiteral(' '), activeTodoWord, f__StringLiteral(' left')), React.createElement(f__StringLiteral('ul'), f__makeObject([['ObjectProperty', f__StringLiteral('className'), f__StringLiteral('filters')]]), React.createElement(f__StringLiteral('li'), null, React.createElement(f__StringLiteral('a'), f__makeObject([['ObjectProperty', f__StringLiteral('href'), f__StringLiteral('#/')], ['ObjectProperty', f__StringLiteral('className'), classNames(f__makeObject([['ObjectProperty', f__StringLiteral('selected'), f__tripleEqual(nowShowing, app.ALL_TODOS)]]))]]), f__StringLiteral('All'))), f__StringLiteral(' '), React.createElement(f__StringLiteral('li'), null, React.createElement(f__StringLiteral('a'), f__makeObject([['ObjectProperty', f__StringLiteral('href'), f__StringLiteral('#/active')], ['ObjectProperty', f__StringLiteral('className'), classNames(f__makeObject([['ObjectProperty', f__StringLiteral('selected'), f__tripleEqual(nowShowing, app.ACTIVE_TODOS)]]))]]), f__StringLiteral('Active'))), f__StringLiteral(' '), React.createElement(f__StringLiteral('li'), null, React.createElement(f__StringLiteral('a'), f__makeObject([['ObjectProperty', f__StringLiteral('href'), f__StringLiteral('#/completed')], ['ObjectProperty', f__StringLiteral('className'), classNames(f__makeObject([['ObjectProperty', f__StringLiteral('selected'), f__tripleEqual(nowShowing, app.COMPLETED_TODOS)]]))]]), f__StringLiteral('Completed')))), clearButton);
	}]])));
})();
//# sourceMappingURL=footer.js.map