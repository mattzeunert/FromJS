'use strict';

/*jshint quotmark:false */
/*jshint white:false */
/*jshint trailing:false */
/*jshint newcap:false */
/*global React, Router*/

var app = f__useValue((f__setCachedValue(app), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__makeObject([]);

(function () {
	'use strict';

	app.ALL_TODOS = f__StringLiteral('all');
	app.ACTIVE_TODOS = f__StringLiteral('active');
	app.COMPLETED_TODOS = f__StringLiteral('completed');
	var TodoFooter = app.TodoFooter;
	var TodoItem = app.TodoItem;

	var ENTER_KEY = 13;

	var TodoApp = React.createClass(f__makeObject([[f__StringLiteral('displayName'), f__StringLiteral('TodoApp')], [f__StringLiteral('getInitialState'), function getInitialState() {
		return f__makeObject([[f__StringLiteral('nowShowing'), app.ALL_TODOS], [f__StringLiteral('editing'), null], [f__StringLiteral('newTodo'), f__StringLiteral('')]]);
	}], [f__StringLiteral('componentDidMount'), function componentDidMount() {
		var setState = this.setState;
		var router = Router(f__makeObject([[f__StringLiteral('/'), setState.bind(this, f__makeObject([[f__StringLiteral('nowShowing'), app.ALL_TODOS]]))], [f__StringLiteral('/active'), setState.bind(this, f__makeObject([[f__StringLiteral('nowShowing'), app.ACTIVE_TODOS]]))], [f__StringLiteral('/completed'), setState.bind(this, f__makeObject([[f__StringLiteral('nowShowing'), app.COMPLETED_TODOS]]))]]));
		router.init(f__StringLiteral('/'));
	}], [f__StringLiteral('handleChange'), function handleChange(event) {
		this.setState(f__makeObject([[f__StringLiteral('newTodo'), event.target.value]]));
	}], [f__StringLiteral('handleNewTodoKeyDown'), function handleNewTodoKeyDown(event) {
		if (f__useValue(f__notTripleEqual(event.keyCode, ENTER_KEY))) {
			return;
		}

		event.preventDefault();

		var val = this.state.newTodo.trim();

		if (f__useValue(val)) {
			this.props.model.addTodo(val);
			this.setState(f__makeObject([[f__StringLiteral('newTodo'), f__StringLiteral('')]]));
		}
	}], [f__StringLiteral('toggleAll'), function toggleAll(event) {
		var checked = event.target.checked;
		this.props.model.toggleAll(checked);
	}], [f__StringLiteral('toggle'), function toggle(todoToToggle) {
		this.props.model.toggle(todoToToggle);
	}], [f__StringLiteral('destroy'), function destroy(todo) {
		this.props.model.destroy(todo);
	}], [f__StringLiteral('edit'), function edit(todo) {
		this.setState(f__makeObject([[f__StringLiteral('editing'), todo.id]]));
	}], [f__StringLiteral('save'), function save(todoToSave, text) {
		this.props.model.save(todoToSave, text);
		this.setState(f__makeObject([[f__StringLiteral('editing'), null]]));
	}], [f__StringLiteral('cancel'), function cancel() {
		this.setState(f__makeObject([[f__StringLiteral('editing'), null]]));
	}], [f__StringLiteral('clearCompleted'), function clearCompleted() {
		this.props.model.clearCompleted();
	}], [f__StringLiteral('render'), function render() {
		var footer;
		var main;
		var todos = this.props.model.todos;

		var shownTodos = todos.filter(function (todo) {
			switch (f__useValue(this.state.nowShowing)) {
				case f__useValue(app.ACTIVE_TODOS):
					return f__not(todo.completed);
				case f__useValue(app.COMPLETED_TODOS):
					return todo.completed;
				default:
					return true;
			}
		}, this);

		var todoItems = shownTodos.map(function (todo) {
			return React.createElement(TodoItem, f__makeObject([[f__StringLiteral('key'), todo.id], [f__StringLiteral('todo'), todo], [f__StringLiteral('onToggle'), this.toggle.bind(this, todo)], [f__StringLiteral('onDestroy'), this.destroy.bind(this, todo)], [f__StringLiteral('onEdit'), this.edit.bind(this, todo)], [f__StringLiteral('editing'), f__tripleEqual(this.state.editing, todo.id)], [f__StringLiteral('onSave'), this.save.bind(this, todo)], [f__StringLiteral('onCancel'), this.cancel]]));
		}, this);

		var activeTodoCount = todos.reduce(function (accum, todo) {
			return f__useValue(todo.completed) ? accum : f__add(accum, 1);
		}, 0);

		var completedCount = todos.length - activeTodoCount;

		if (f__useValue(f__useValue((f__setCachedValue(activeTodoCount), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : completedCount)) {
			footer = React.createElement(TodoFooter, f__makeObject([[f__StringLiteral('count'), activeTodoCount], [f__StringLiteral('completedCount'), completedCount], [f__StringLiteral('nowShowing'), this.state.nowShowing], [f__StringLiteral('onClearCompleted'), this.clearCompleted]]));
		}

		if (f__useValue(todos.length)) {
			main = React.createElement(f__StringLiteral('section'), f__makeObject([[f__StringLiteral('className'), f__StringLiteral('main')]]), React.createElement(f__StringLiteral('input'), f__makeObject([[f__StringLiteral('className'), f__StringLiteral('toggle-all')], [f__StringLiteral('type'), f__StringLiteral('checkbox')], [f__StringLiteral('onChange'), this.toggleAll], [f__StringLiteral('checked'), f__tripleEqual(activeTodoCount, 0)]])), React.createElement(f__StringLiteral('ul'), f__makeObject([[f__StringLiteral('className'), f__StringLiteral('todo-list')]]), todoItems));
		}

		return React.createElement(f__StringLiteral('div'), null, React.createElement(f__StringLiteral('header'), f__makeObject([[f__StringLiteral('className'), f__StringLiteral('header')]]), React.createElement(f__StringLiteral('h1'), null, f__StringLiteral('todos')), React.createElement(f__StringLiteral('input'), f__makeObject([[f__StringLiteral('className'), f__StringLiteral('new-todo')], [f__StringLiteral('placeholder'), f__StringLiteral('What needs to be done?')], [f__StringLiteral('value'), this.state.newTodo], [f__StringLiteral('onKeyDown'), this.handleNewTodoKeyDown], [f__StringLiteral('onChange'), this.handleChange], [f__StringLiteral('autoFocus'), true]]))), main, footer);
	}]]));

	var model = new app.TodoModel(f__StringLiteral('react-todos'));

	function render() {
		React.render(React.createElement(TodoApp, f__makeObject([[f__StringLiteral('model'), model]])), document.getElementsByClassName(f__StringLiteral('todoapp'))[0]);
	}

	model.subscribe(render);
	render();
})();
//# sourceMappingURL=app.js.map