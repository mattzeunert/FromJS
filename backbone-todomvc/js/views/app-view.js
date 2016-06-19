/*global Backbone, jQuery, _, ENTER_KEY */
var app = app || {};

(function ($) {
	'use strict'

	// The Application
	// ---------------

	// Our overall **AppView** is the top-level piece of UI.
	;
	app.AppView = Backbone.View.extend({

		// Instead of generating a new element, bind to the existing skeleton of
		// the App already present in the HTML.
		el: '.todoapp',

		// Our template for the line of statistics at the bottom of the app.
		statsTemplate: _.template($(stringTrace('#stats-template')).html()),

		// Delegated events for creating new items, and clearing completed ones.
		events: {
			'keypress .new-todo': 'createOnEnter',
			'click .clear-completed': 'clearCompleted',
			'click .toggle-all': 'toggleAllComplete'
		},

		// At initialization we bind to the relevant events on the `Todos`
		// collection, when items are added or changed. Kick things off by
		// loading any preexisting todos that might be saved in *localStorage*.
		initialize: function () {
			this.allCheckbox = this.$(stringTrace('.toggle-all'))[0];
			this.$input = this.$(stringTrace('.new-todo'));
			this.$footer = this.$(stringTrace('.footer'));
			this.$main = this.$(stringTrace('.main'));
			this.$list = $(stringTrace('.todo-list'));

			this.listenTo(app.todos, stringTrace('add'), this.addOne);
			this.listenTo(app.todos, stringTrace('reset'), this.addAll);
			this.listenTo(app.todos, stringTrace('change:completed'), this.filterOne);
			this.listenTo(app.todos, stringTrace('filter'), this.filterAll);
			this.listenTo(app.todos, stringTrace('all'), _.debounce(this.render, 0));

			// Suppresses 'add' events with {reset: true} and prevents the app view
			// from being re-rendered for every model. Only renders when the 'reset'
			// event is triggered at the end of the fetch.
			app.todos.fetch({ reset: true });
		},

		// Re-rendering the App just means refreshing the statistics -- the rest
		// of the app doesn't change.
		render: function () {
			var completed = app.todos.completed().length;
			var remaining = app.todos.remaining().length;

			if (app.todos.length) {
				this.$main.show();
				this.$footer.show();

				this.$footer.html(this.statsTemplate({
					completed: completed,
					remaining: remaining
				}));

				this.$(stringTrace('.filters li a')).removeClass(stringTrace('selected')).filter(stringTraceAdd(stringTraceAdd(stringTrace('[href="#/'), app.TodoFilter || stringTrace('')), stringTrace('"]'))).addClass(stringTrace('selected'));
			} else {
				this.$main.hide();
				this.$footer.hide();
			}

			this.allCheckbox.checked = !remaining;
		},

		// Add a single todo item to the list by creating a view for it, and
		// appending its element to the `<ul>`.
		addOne: function (todo) {
			var view = new app.TodoView({ model: todo });
			this.$list.append(view.render().el);
		},

		// Add all items in the **Todos** collection at once.
		addAll: function () {
			this.$list.html(stringTrace(''));
			app.todos.each(this.addOne, this);
		},

		filterOne: function (todo) {
			todo.trigger(stringTrace('visible'));
		},

		filterAll: function () {
			app.todos.each(this.filterOne, this);
		},

		// Generate the attributes for a new Todo item.
		newAttributes: function () {
			return {
				title: this.$input.val().trim(),
				order: app.todos.nextOrder(),
				completed: false
			};
		},

		// If you hit return in the main input field, create new **Todo** model,
		// persisting it to *localStorage*.
		createOnEnter: function (e) {
			if (stringTraceTripleEqual(e.which, ENTER_KEY) && this.$input.val().trim()) {
				app.todos.create(this.newAttributes());
				this.$input.val(stringTrace(''));
			}
		},

		// Clear all completed todo items, destroying their models.
		clearCompleted: function () {
			_.invoke(app.todos.completed(), stringTrace('destroy'));
			return false;
		},

		toggleAllComplete: function () {
			var completed = this.allCheckbox.checked;

			app.todos.each(function (todo) {
				todo.save({
					completed: completed
				});
			});
		}
	});
})(jQuery);

//# sourceMappingURL=data:application/json;base64,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RSxDQUFDLENBQUM7QUFDdkMsUUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLGlCQUFJLENBQUM7SUFDcEI7R0FDRDs7O0FBR0QsZ0JBQWMsRUFBRSxZQUFZO0FBQzNCLElBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUseUJBQVksQ0FBQztBQUMzQyxVQUFPLEtBQUssQ0FBQztHQUNiOztBQUVELG1CQUFpQixFQUFFLFlBQVk7QUFDOUIsT0FBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUM7O0FBRXpDLE1BQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxFQUFFO0FBQzlCLFFBQUksQ0FBQyxJQUFJLENBQUM7QUFDVCxjQUFTLEVBQUUsU0FBUztLQUNwQixDQUFDLENBQUM7SUFDSCxDQUFDLENBQUM7R0FDSDtFQUNELENBQUMsQ0FBQztDQUNILENBQUEsQ0FBRSxNQUFNLENBQUMsQ0FBQyIsImZpbGUiOiJhcHAtdmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qZ2xvYmFsIEJhY2tib25lLCBqUXVlcnksIF8sIEVOVEVSX0tFWSAqL1xudmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgkKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHQvLyBUaGUgQXBwbGljYXRpb25cblx0Ly8gLS0tLS0tLS0tLS0tLS0tXG5cblx0Ly8gT3VyIG92ZXJhbGwgKipBcHBWaWV3KiogaXMgdGhlIHRvcC1sZXZlbCBwaWVjZSBvZiBVSS5cblx0YXBwLkFwcFZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG5cblx0XHQvLyBJbnN0ZWFkIG9mIGdlbmVyYXRpbmcgYSBuZXcgZWxlbWVudCwgYmluZCB0byB0aGUgZXhpc3Rpbmcgc2tlbGV0b24gb2Zcblx0XHQvLyB0aGUgQXBwIGFscmVhZHkgcHJlc2VudCBpbiB0aGUgSFRNTC5cblx0XHRlbDogJy50b2RvYXBwJyxcblxuXHRcdC8vIE91ciB0ZW1wbGF0ZSBmb3IgdGhlIGxpbmUgb2Ygc3RhdGlzdGljcyBhdCB0aGUgYm90dG9tIG9mIHRoZSBhcHAuXG5cdFx0c3RhdHNUZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjc3RhdHMtdGVtcGxhdGUnKS5odG1sKCkpLFxuXG5cdFx0Ly8gRGVsZWdhdGVkIGV2ZW50cyBmb3IgY3JlYXRpbmcgbmV3IGl0ZW1zLCBhbmQgY2xlYXJpbmcgY29tcGxldGVkIG9uZXMuXG5cdFx0ZXZlbnRzOiB7XG5cdFx0XHQna2V5cHJlc3MgLm5ldy10b2RvJzogJ2NyZWF0ZU9uRW50ZXInLFxuXHRcdFx0J2NsaWNrIC5jbGVhci1jb21wbGV0ZWQnOiAnY2xlYXJDb21wbGV0ZWQnLFxuXHRcdFx0J2NsaWNrIC50b2dnbGUtYWxsJzogJ3RvZ2dsZUFsbENvbXBsZXRlJ1xuXHRcdH0sXG5cblx0XHQvLyBBdCBpbml0aWFsaXphdGlvbiB3ZSBiaW5kIHRvIHRoZSByZWxldmFudCBldmVudHMgb24gdGhlIGBUb2Rvc2Bcblx0XHQvLyBjb2xsZWN0aW9uLCB3aGVuIGl0ZW1zIGFyZSBhZGRlZCBvciBjaGFuZ2VkLiBLaWNrIHRoaW5ncyBvZmYgYnlcblx0XHQvLyBsb2FkaW5nIGFueSBwcmVleGlzdGluZyB0b2RvcyB0aGF0IG1pZ2h0IGJlIHNhdmVkIGluICpsb2NhbFN0b3JhZ2UqLlxuXHRcdGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHRoaXMuYWxsQ2hlY2tib3ggPSB0aGlzLiQoJy50b2dnbGUtYWxsJylbMF07XG5cdFx0XHR0aGlzLiRpbnB1dCA9IHRoaXMuJCgnLm5ldy10b2RvJyk7XG5cdFx0XHR0aGlzLiRmb290ZXIgPSB0aGlzLiQoJy5mb290ZXInKTtcblx0XHRcdHRoaXMuJG1haW4gPSB0aGlzLiQoJy5tYWluJyk7XG5cdFx0XHR0aGlzLiRsaXN0ID0gJCgnLnRvZG8tbGlzdCcpO1xuXG5cdFx0XHR0aGlzLmxpc3RlblRvKGFwcC50b2RvcywgJ2FkZCcsIHRoaXMuYWRkT25lKTtcblx0XHRcdHRoaXMubGlzdGVuVG8oYXBwLnRvZG9zLCAncmVzZXQnLCB0aGlzLmFkZEFsbCk7XG5cdFx0XHR0aGlzLmxpc3RlblRvKGFwcC50b2RvcywgJ2NoYW5nZTpjb21wbGV0ZWQnLCB0aGlzLmZpbHRlck9uZSk7XG5cdFx0XHR0aGlzLmxpc3RlblRvKGFwcC50b2RvcywgJ2ZpbHRlcicsIHRoaXMuZmlsdGVyQWxsKTtcblx0XHRcdHRoaXMubGlzdGVuVG8oYXBwLnRvZG9zLCAnYWxsJywgXy5kZWJvdW5jZSh0aGlzLnJlbmRlciwgMCkpO1xuXG5cdFx0XHQvLyBTdXBwcmVzc2VzICdhZGQnIGV2ZW50cyB3aXRoIHtyZXNldDogdHJ1ZX0gYW5kIHByZXZlbnRzIHRoZSBhcHAgdmlld1xuXHRcdFx0Ly8gZnJvbSBiZWluZyByZS1yZW5kZXJlZCBmb3IgZXZlcnkgbW9kZWwuIE9ubHkgcmVuZGVycyB3aGVuIHRoZSAncmVzZXQnXG5cdFx0XHQvLyBldmVudCBpcyB0cmlnZ2VyZWQgYXQgdGhlIGVuZCBvZiB0aGUgZmV0Y2guXG5cdFx0XHRhcHAudG9kb3MuZmV0Y2goe3Jlc2V0OiB0cnVlfSk7XG5cdFx0fSxcblxuXHRcdC8vIFJlLXJlbmRlcmluZyB0aGUgQXBwIGp1c3QgbWVhbnMgcmVmcmVzaGluZyB0aGUgc3RhdGlzdGljcyAtLSB0aGUgcmVzdFxuXHRcdC8vIG9mIHRoZSBhcHAgZG9lc24ndCBjaGFuZ2UuXG5cdFx0cmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgY29tcGxldGVkID0gYXBwLnRvZG9zLmNvbXBsZXRlZCgpLmxlbmd0aDtcblx0XHRcdHZhciByZW1haW5pbmcgPSBhcHAudG9kb3MucmVtYWluaW5nKCkubGVuZ3RoO1xuXG5cdFx0XHRpZiAoYXBwLnRvZG9zLmxlbmd0aCkge1xuXHRcdFx0XHR0aGlzLiRtYWluLnNob3coKTtcblx0XHRcdFx0dGhpcy4kZm9vdGVyLnNob3coKTtcblxuXHRcdFx0XHR0aGlzLiRmb290ZXIuaHRtbCh0aGlzLnN0YXRzVGVtcGxhdGUoe1xuXHRcdFx0XHRcdGNvbXBsZXRlZDogY29tcGxldGVkLFxuXHRcdFx0XHRcdHJlbWFpbmluZzogcmVtYWluaW5nXG5cdFx0XHRcdH0pKTtcblxuXHRcdFx0XHR0aGlzLiQoJy5maWx0ZXJzIGxpIGEnKVxuXHRcdFx0XHRcdC5yZW1vdmVDbGFzcygnc2VsZWN0ZWQnKVxuXHRcdFx0XHRcdC5maWx0ZXIoJ1tocmVmPVwiIy8nICsgKGFwcC5Ub2RvRmlsdGVyIHx8ICcnKSArICdcIl0nKVxuXHRcdFx0XHRcdC5hZGRDbGFzcygnc2VsZWN0ZWQnKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuJG1haW4uaGlkZSgpO1xuXHRcdFx0XHR0aGlzLiRmb290ZXIuaGlkZSgpO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmFsbENoZWNrYm94LmNoZWNrZWQgPSAhcmVtYWluaW5nO1xuXHRcdH0sXG5cblx0XHQvLyBBZGQgYSBzaW5nbGUgdG9kbyBpdGVtIHRvIHRoZSBsaXN0IGJ5IGNyZWF0aW5nIGEgdmlldyBmb3IgaXQsIGFuZFxuXHRcdC8vIGFwcGVuZGluZyBpdHMgZWxlbWVudCB0byB0aGUgYDx1bD5gLlxuXHRcdGFkZE9uZTogZnVuY3Rpb24gKHRvZG8pIHtcblx0XHRcdHZhciB2aWV3ID0gbmV3IGFwcC5Ub2RvVmlldyh7IG1vZGVsOiB0b2RvIH0pO1xuXHRcdFx0dGhpcy4kbGlzdC5hcHBlbmQodmlldy5yZW5kZXIoKS5lbCk7XG5cdFx0fSxcblxuXHRcdC8vIEFkZCBhbGwgaXRlbXMgaW4gdGhlICoqVG9kb3MqKiBjb2xsZWN0aW9uIGF0IG9uY2UuXG5cdFx0YWRkQWxsOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHR0aGlzLiRsaXN0Lmh0bWwoJycpO1xuXHRcdFx0YXBwLnRvZG9zLmVhY2godGhpcy5hZGRPbmUsIHRoaXMpO1xuXHRcdH0sXG5cblx0XHRmaWx0ZXJPbmU6IGZ1bmN0aW9uICh0b2RvKSB7XG5cdFx0XHR0b2RvLnRyaWdnZXIoJ3Zpc2libGUnKTtcblx0XHR9LFxuXG5cdFx0ZmlsdGVyQWxsOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRhcHAudG9kb3MuZWFjaCh0aGlzLmZpbHRlck9uZSwgdGhpcyk7XG5cdFx0fSxcblxuXHRcdC8vIEdlbmVyYXRlIHRoZSBhdHRyaWJ1dGVzIGZvciBhIG5ldyBUb2RvIGl0ZW0uXG5cdFx0bmV3QXR0cmlidXRlczogZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dGl0bGU6IHRoaXMuJGlucHV0LnZhbCgpLnRyaW0oKSxcblx0XHRcdFx0b3JkZXI6IGFwcC50b2Rvcy5uZXh0T3JkZXIoKSxcblx0XHRcdFx0Y29tcGxldGVkOiBmYWxzZVxuXHRcdFx0fTtcblx0XHR9LFxuXG5cdFx0Ly8gSWYgeW91IGhpdCByZXR1cm4gaW4gdGhlIG1haW4gaW5wdXQgZmllbGQsIGNyZWF0ZSBuZXcgKipUb2RvKiogbW9kZWwsXG5cdFx0Ly8gcGVyc2lzdGluZyBpdCB0byAqbG9jYWxTdG9yYWdlKi5cblx0XHRjcmVhdGVPbkVudGVyOiBmdW5jdGlvbiAoZSkge1xuXHRcdFx0aWYgKGUud2hpY2ggPT09IEVOVEVSX0tFWSAmJiB0aGlzLiRpbnB1dC52YWwoKS50cmltKCkpIHtcblx0XHRcdFx0YXBwLnRvZG9zLmNyZWF0ZSh0aGlzLm5ld0F0dHJpYnV0ZXMoKSk7XG5cdFx0XHRcdHRoaXMuJGlucHV0LnZhbCgnJyk7XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdC8vIENsZWFyIGFsbCBjb21wbGV0ZWQgdG9kbyBpdGVtcywgZGVzdHJveWluZyB0aGVpciBtb2RlbHMuXG5cdFx0Y2xlYXJDb21wbGV0ZWQ6IGZ1bmN0aW9uICgpIHtcblx0XHRcdF8uaW52b2tlKGFwcC50b2Rvcy5jb21wbGV0ZWQoKSwgJ2Rlc3Ryb3knKTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9LFxuXG5cdFx0dG9nZ2xlQWxsQ29tcGxldGU6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBjb21wbGV0ZWQgPSB0aGlzLmFsbENoZWNrYm94LmNoZWNrZWQ7XG5cblx0XHRcdGFwcC50b2Rvcy5lYWNoKGZ1bmN0aW9uICh0b2RvKSB7XG5cdFx0XHRcdHRvZG8uc2F2ZSh7XG5cdFx0XHRcdFx0Y29tcGxldGVkOiBjb21wbGV0ZWRcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0pO1xufSkoalF1ZXJ5KTtcbiJdfQ==