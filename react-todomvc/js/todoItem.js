"use strict";

/*jshint quotmark: false */
/*jshint white: false */
/*jshint trailing: false */
/*jshint newcap: false */
/*global React */

var app = f__useValue((f__setCachedValue(app), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__makeObject([]);

(function () {
	'use strict';

	var ESCAPE_KEY = 27;
	var ENTER_KEY = 13;

	app.TodoItem = React.createClass(f__makeObject([[f__StringLiteral("displayName"), f__StringLiteral("TodoItem")], [f__StringLiteral("handleSubmit"), function handleSubmit(event) {
		var val = this.state.editText.trim();
		if (f__useValue(val)) {
			this.props.onSave(val);
			this.setState(f__makeObject([[f__StringLiteral("editText"), val]]));
		} else {
			this.props.onDestroy();
		}
	}], [f__StringLiteral("handleEdit"), function handleEdit() {
		this.props.onEdit();
		this.setState(f__makeObject([[f__StringLiteral("editText"), this.props.todo.title]]));
	}], [f__StringLiteral("handleKeyDown"), function handleKeyDown(event) {
		if (f__useValue(f__tripleEqual(event.which, ESCAPE_KEY))) {
			this.setState(f__makeObject([[f__StringLiteral("editText"), this.props.todo.title]]));
			this.props.onCancel(event);
		} else if (f__useValue(f__tripleEqual(event.which, ENTER_KEY))) {
			this.handleSubmit(event);
		}
	}], [f__StringLiteral("handleChange"), function handleChange(event) {
		if (f__useValue(this.props.editing)) {
			this.setState(f__makeObject([[f__StringLiteral("editText"), event.target.value]]));
		}
	}], [f__StringLiteral("getInitialState"), function getInitialState() {
		return f__makeObject([[f__StringLiteral("editText"), this.props.todo.title]]);
	}], [f__StringLiteral("shouldComponentUpdate"), function shouldComponentUpdate(nextProps, nextState) {
		return f__useValue((f__setCachedValue(f__useValue((f__setCachedValue(f__notTripleEqual(nextProps.todo, this.props.todo)), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__notTripleEqual(nextProps.editing, this.props.editing)), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__notTripleEqual(nextState.editText, this.state.editText);
	}], [f__StringLiteral("componentDidUpdate"), function componentDidUpdate(prevProps) {
		if (f__useValue(f__useValue((f__setCachedValue(f__not(prevProps.editing)), f__useValue(f__getCachedValue()))) ? this.props.editing : f__getCachedValue())) {
			var node = React.findDOMNode(this.refs.editField);
			node.focus();
			node.setSelectionRange(node.value.length, node.value.length);
		}
	}], [f__StringLiteral("render"), function render() {
		return React.createElement(f__StringLiteral("li"), f__makeObject([[f__StringLiteral("className"), classNames(f__makeObject([[f__StringLiteral("completed"), this.props.todo.completed], [f__StringLiteral("editing"), this.props.editing]]))]]), React.createElement(f__StringLiteral("div"), f__makeObject([[f__StringLiteral("className"), f__StringLiteral("view")]]), React.createElement(f__StringLiteral("input"), f__makeObject([[f__StringLiteral("className"), f__StringLiteral("toggle")], [f__StringLiteral("type"), f__StringLiteral("checkbox")], [f__StringLiteral("checked"), this.props.todo.completed], [f__StringLiteral("onChange"), this.props.onToggle]])), React.createElement(f__StringLiteral("label"), f__makeObject([[f__StringLiteral("onDoubleClick"), this.handleEdit]]), this.props.todo.title), React.createElement(f__StringLiteral("button"), f__makeObject([[f__StringLiteral("className"), f__StringLiteral("destroy")], [f__StringLiteral("onClick"), this.props.onDestroy]]))), React.createElement(f__StringLiteral("input"), f__makeObject([[f__StringLiteral("ref"), f__StringLiteral("editField")], [f__StringLiteral("className"), f__StringLiteral("edit")], [f__StringLiteral("value"), this.state.editText], [f__StringLiteral("onBlur"), this.handleSubmit], [f__StringLiteral("onChange"), this.handleChange], [f__StringLiteral("onKeyDown"), this.handleKeyDown]])));
	}]]));
})();
//# sourceMappingURL=todoItem.js.map