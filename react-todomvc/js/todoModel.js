'use strict';

/*jshint quotmark:false */
/*jshint white:false */
/*jshint trailing:false */
/*jshint newcap:false */

var app = f__useValue((f__setCachedValue(app), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__makeObject([]);

(function () {
	'use strict';

	var Utils = app.Utils;
	// Generic "model" object. You can use whatever
	// framework you want. For this application it
	// may not even be worth separating this logic
	// out, but we do this to demonstrate one way to
	// separate out parts of your application.
	app.TodoModel = function (key) {
		this.key = key;
		this.todos = Utils.store(key);
		this.onChanges = [];
	};

	app.TodoModel.prototype.subscribe = function (onChange) {
		this.onChanges.push(onChange);
	};

	app.TodoModel.prototype.inform = function () {
		Utils.store(this.key, this.todos);
		this.onChanges.forEach(function (cb) {
			cb();
		});
	};

	app.TodoModel.prototype.addTodo = function (title) {
		this.todos = this.todos.concat(f__makeObject([[f__StringLiteral('id'), Utils.uuid()], [f__StringLiteral('title'), title], [f__StringLiteral('completed'), false]]));

		this.inform();
	};

	app.TodoModel.prototype.toggleAll = function (checked) {
		// Note: it's usually better to use immutable data structures since they're
		// easier to reason about and React works very well with them. That's why
		// we use map() and filter() everywhere instead of mutating the array or
		// todo items themselves.
		this.todos = this.todos.map(function (todo) {
			return Utils.extend(f__makeObject([]), todo, f__makeObject([[f__StringLiteral('completed'), checked]]));
		});

		this.inform();
	};

	app.TodoModel.prototype.toggle = function (todoToToggle) {
		this.todos = this.todos.map(function (todo) {
			return f__useValue(f__notTripleEqual(todo, todoToToggle)) ? todo : Utils.extend(f__makeObject([]), todo, f__makeObject([[f__StringLiteral('completed'), f__not(todo.completed)]]));
		});

		this.inform();
	};

	app.TodoModel.prototype.destroy = function (todo) {
		this.todos = this.todos.filter(function (candidate) {
			return f__notTripleEqual(candidate, todo);
		});

		this.inform();
	};

	app.TodoModel.prototype.save = function (todoToSave, text) {
		this.todos = this.todos.map(function (todo) {
			return f__useValue(f__notTripleEqual(todo, todoToSave)) ? todo : Utils.extend(f__makeObject([]), todo, f__makeObject([[f__StringLiteral('title'), text]]));
		});

		this.inform();
	};

	app.TodoModel.prototype.clearCompleted = function () {
		this.todos = this.todos.filter(function (todo) {
			return f__not(todo.completed);
		});

		this.inform();
	};
})();
//# sourceMappingURL=todoModel.js.map