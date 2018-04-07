'use strict';

/*jshint quotmark:false */
/*jshint white:false */
/*jshint trailing:false */
/*jshint newcap:false */
/*global React, Router*/

var app = f__useValue((f__setCachedValue(app), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__makeObject([]);

(function () {
	'use strict';

	f__assign(app, f__StringLiteral('ALL_TODOS'), f__StringLiteral('all'));
	f__assign(app, f__StringLiteral('ACTIVE_TODOS'), f__StringLiteral('active'));
	f__assign(app, f__StringLiteral('COMPLETED_TODOS'), f__StringLiteral('completed'));
	var TodoFooter = app.TodoFooter;
	var TodoItem = app.TodoItem;

	var ENTER_KEY = 13;

	var TodoApp = React.createClass(f__makeObject([['ObjectProperty', f__StringLiteral('displayName'), f__StringLiteral('TodoApp')], ['ObjectProperty', f__StringLiteral('getInitialState'), function getInitialState() {
		return f__makeObject([['ObjectProperty', f__StringLiteral('nowShowing'), app.ALL_TODOS], ['ObjectProperty', f__StringLiteral('editing'), null], ['ObjectProperty', f__StringLiteral('newTodo'), f__StringLiteral('')]]);
	}], ['ObjectProperty', f__StringLiteral('componentDidMount'), function componentDidMount() {
		var setState = this.setState;
		var router = Router(f__makeObject([['ObjectProperty', f__StringLiteral('/'), setState.bind(this, f__makeObject([['ObjectProperty', f__StringLiteral('nowShowing'), app.ALL_TODOS]]))], ['ObjectProperty', f__StringLiteral('/active'), setState.bind(this, f__makeObject([['ObjectProperty', f__StringLiteral('nowShowing'), app.ACTIVE_TODOS]]))], ['ObjectProperty', f__StringLiteral('/completed'), setState.bind(this, f__makeObject([['ObjectProperty', f__StringLiteral('nowShowing'), app.COMPLETED_TODOS]]))]]));
		router.init(f__StringLiteral('/'));
	}], ['ObjectProperty', f__StringLiteral('handleChange'), function handleChange(event) {
		this.setState(f__makeObject([['ObjectProperty', f__StringLiteral('newTodo'), event.target.value]]));
	}], ['ObjectProperty', f__StringLiteral('handleNewTodoKeyDown'), function handleNewTodoKeyDown(event) {
		if (f__useValue(f__notTripleEqual(event.keyCode, ENTER_KEY))) {
			return;
		}

		event.preventDefault();

		var val = this.state.newTodo.trim();

		if (f__useValue(val)) {
			this.props.model.addTodo(val);
			this.setState(f__makeObject([['ObjectProperty', f__StringLiteral('newTodo'), f__StringLiteral('')]]));
		}
	}], ['ObjectProperty', f__StringLiteral('toggleAll'), function toggleAll(event) {
		var checked = event.target.checked;
		this.props.model.toggleAll(checked);
	}], ['ObjectProperty', f__StringLiteral('toggle'), function toggle(todoToToggle) {
		this.props.model.toggle(todoToToggle);
	}], ['ObjectProperty', f__StringLiteral('destroy'), function destroy(todo) {
		this.props.model.destroy(todo);
	}], ['ObjectProperty', f__StringLiteral('edit'), function edit(todo) {
		this.setState(f__makeObject([['ObjectProperty', f__StringLiteral('editing'), todo.id]]));
	}], ['ObjectProperty', f__StringLiteral('save'), function save(todoToSave, text) {
		this.props.model.save(todoToSave, text);
		this.setState(f__makeObject([['ObjectProperty', f__StringLiteral('editing'), null]]));
	}], ['ObjectProperty', f__StringLiteral('cancel'), function cancel() {
		this.setState(f__makeObject([['ObjectProperty', f__StringLiteral('editing'), null]]));
	}], ['ObjectProperty', f__StringLiteral('clearCompleted'), function clearCompleted() {
		this.props.model.clearCompleted();
	}], ['ObjectProperty', f__StringLiteral('render'), function render() {
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
			return React.createElement(TodoItem, f__makeObject([['ObjectProperty', f__StringLiteral('key'), todo.id], ['ObjectProperty', f__StringLiteral('todo'), todo], ['ObjectProperty', f__StringLiteral('onToggle'), this.toggle.bind(this, todo)], ['ObjectProperty', f__StringLiteral('onDestroy'), this.destroy.bind(this, todo)], ['ObjectProperty', f__StringLiteral('onEdit'), this.edit.bind(this, todo)], ['ObjectProperty', f__StringLiteral('editing'), f__tripleEqual(this.state.editing, todo.id)], ['ObjectProperty', f__StringLiteral('onSave'), this.save.bind(this, todo)], ['ObjectProperty', f__StringLiteral('onCancel'), this.cancel]]));
		}, this);

		var activeTodoCount = todos.reduce(function (accum, todo) {
			return f__useValue(todo.completed) ? accum : f__add(accum, 1);
		}, 0);

		var completedCount = f__subtract(todos.length, activeTodoCount);

		if (f__useValue(f__useValue((f__setCachedValue(activeTodoCount), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : completedCount)) {
			footer = React.createElement(TodoFooter, f__makeObject([['ObjectProperty', f__StringLiteral('count'), activeTodoCount], ['ObjectProperty', f__StringLiteral('completedCount'), completedCount], ['ObjectProperty', f__StringLiteral('nowShowing'), this.state.nowShowing], ['ObjectProperty', f__StringLiteral('onClearCompleted'), this.clearCompleted]]));
		}

		if (f__useValue(todos.length)) {
			main = React.createElement(f__StringLiteral('section'), f__makeObject([['ObjectProperty', f__StringLiteral('className'), f__StringLiteral('main')]]), React.createElement(f__StringLiteral('input'), f__makeObject([['ObjectProperty', f__StringLiteral('className'), f__StringLiteral('toggle-all')], ['ObjectProperty', f__StringLiteral('type'), f__StringLiteral('checkbox')], ['ObjectProperty', f__StringLiteral('onChange'), this.toggleAll], ['ObjectProperty', f__StringLiteral('checked'), f__tripleEqual(activeTodoCount, 0)]])), React.createElement(f__StringLiteral('ul'), f__makeObject([['ObjectProperty', f__StringLiteral('className'), f__StringLiteral('todo-list')]]), todoItems));
		}

		return React.createElement(f__StringLiteral('div'), null, React.createElement(f__StringLiteral('header'), f__makeObject([['ObjectProperty', f__StringLiteral('className'), f__StringLiteral('header')]]), React.createElement(f__StringLiteral('h1'), null, f__StringLiteral('todos')), React.createElement(f__StringLiteral('input'), f__makeObject([['ObjectProperty', f__StringLiteral('className'), f__StringLiteral('new-todo')], ['ObjectProperty', f__StringLiteral('placeholder'), f__StringLiteral('What needs to be done?')], ['ObjectProperty', f__StringLiteral('value'), this.state.newTodo], ['ObjectProperty', f__StringLiteral('onKeyDown'), this.handleNewTodoKeyDown], ['ObjectProperty', f__StringLiteral('onChange'), this.handleChange], ['ObjectProperty', f__StringLiteral('autoFocus'), true]]))), main, footer);
	}]]));

	var model = new app.TodoModel(f__StringLiteral('react-todos'));

	function render() {
		React.render(React.createElement(TodoApp, f__makeObject([['ObjectProperty', f__StringLiteral('model'), model]])), document.getElementsByClassName(f__StringLiteral('todoapp'))[0]);
	}

	model.subscribe(render);
	render();
})();
//# sourceMappingURL=app.js.map