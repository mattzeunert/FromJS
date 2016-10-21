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
	f__assign(app, f__StringLiteral('TodoModel'), function (key) {
		f__assign(this, f__StringLiteral('key'), key);
		f__assign(this, f__StringLiteral('todos'), Utils.store(key));
		f__assign(this, f__StringLiteral('onChanges'), []);
	});

	f__assign(app.TodoModel.prototype, f__StringLiteral('subscribe'), function (onChange) {
		this.onChanges.push(onChange);
	});

	f__assign(app.TodoModel.prototype, f__StringLiteral('inform'), function () {
		Utils.store(this.key, this.todos);
		this.onChanges.forEach(function (cb) {
			cb();
		});
	});

	f__assign(app.TodoModel.prototype, f__StringLiteral('addTodo'), function (title) {
		f__assign(this, f__StringLiteral('todos'), this.todos.concat(f__makeObject([['ObjectProperty', f__StringLiteral('id'), Utils.uuid()], ['ObjectProperty', f__StringLiteral('title'), title], ['ObjectProperty', f__StringLiteral('completed'), false]])));

		this.inform();
	});

	f__assign(app.TodoModel.prototype, f__StringLiteral('toggleAll'), function (checked) {
		// Note: it's usually better to use immutable data structures since they're
		// easier to reason about and React works very well with them. That's why
		// we use map() and filter() everywhere instead of mutating the array or
		// todo items themselves.
		f__assign(this, f__StringLiteral('todos'), this.todos.map(function (todo) {
			return Utils.extend(f__makeObject([]), todo, f__makeObject([['ObjectProperty', f__StringLiteral('completed'), checked]]));
		}));

		this.inform();
	});

	f__assign(app.TodoModel.prototype, f__StringLiteral('toggle'), function (todoToToggle) {
		f__assign(this, f__StringLiteral('todos'), this.todos.map(function (todo) {
			return f__useValue(f__notTripleEqual(todo, todoToToggle)) ? todo : Utils.extend(f__makeObject([]), todo, f__makeObject([['ObjectProperty', f__StringLiteral('completed'), f__not(todo.completed)]]));
		}));

		this.inform();
	});

	f__assign(app.TodoModel.prototype, f__StringLiteral('destroy'), function (todo) {
		f__assign(this, f__StringLiteral('todos'), this.todos.filter(function (candidate) {
			return f__notTripleEqual(candidate, todo);
		}));

		this.inform();
	});

	f__assign(app.TodoModel.prototype, f__StringLiteral('save'), function (todoToSave, text) {
		f__assign(this, f__StringLiteral('todos'), this.todos.map(function (todo) {
			return f__useValue(f__notTripleEqual(todo, todoToSave)) ? todo : Utils.extend(f__makeObject([]), todo, f__makeObject([['ObjectProperty', f__StringLiteral('title'), text]]));
		}));

		this.inform();
	});

	f__assign(app.TodoModel.prototype, f__StringLiteral('clearCompleted'), function () {
		f__assign(this, f__StringLiteral('todos'), this.todos.filter(function (todo) {
			return f__not(todo.completed);
		}));

		this.inform();
	});
})();
//# sourceMappingURL=todoModel.js.map