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
		el: stringTrace('.todoapp'),

		// Our template for the line of statistics at the bottom of the app.
		statsTemplate: _.template($(stringTrace('#stats-template')).html()),

		// Delegated events for creating new items, and clearing completed ones.
		events: {
			'keypress .new-todo': stringTrace('createOnEnter'),
			'click .clear-completed': stringTrace('clearCompleted'),
			'click .toggle-all': stringTrace('toggleAllComplete')
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC12aWV3LW9yaWdpbmFsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFDQSxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksRUFBRSxDQUFDOztBQUVwQixDQUFDLFVBQVUsQ0FBQyxFQUFFO0FBQ2I7Ozs7OztBQUFZLEVBQUM7QUFNYixJQUFHLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDOzs7O0FBSWxDLElBQUUseUJBQVk7OztBQUdkLGVBQWEsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0NBQW1CLENBQUMsSUFBSSxFQUFFLENBQUM7OztBQUd0RCxRQUFNLEVBQUU7QUFDUCx1QkFBb0IsOEJBQWlCO0FBQ3JDLDJCQUF3QiwrQkFBa0I7QUFDMUMsc0JBQW1CLGtDQUFxQjtHQUN4Qzs7Ozs7QUFLRCxZQUFVLEVBQUUsWUFBWTtBQUN2QixPQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxDQUFDLDRCQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUMsT0FBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsQ0FBQywwQkFBYSxDQUFDO0FBQ2xDLE9BQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLENBQUMsd0JBQVcsQ0FBQztBQUNqQyxPQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDLHNCQUFTLENBQUM7QUFDN0IsT0FBSSxDQUFDLEtBQUssR0FBRyxDQUFDLDJCQUFjLENBQUM7O0FBRTdCLE9BQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssc0JBQVMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzdDLE9BQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssd0JBQVcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQy9DLE9BQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssbUNBQXNCLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUM3RCxPQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLHlCQUFZLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNuRCxPQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLHNCQUFTLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQzs7Ozs7QUFBQyxBQUs1RCxNQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFDLEtBQUssRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0dBQy9COzs7O0FBSUQsUUFBTSxFQUFFLFlBQVk7QUFDbkIsT0FBSSxTQUFTLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxNQUFNLENBQUM7QUFDN0MsT0FBSSxTQUFTLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxNQUFNLENBQUM7O0FBRTdDLE9BQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUU7QUFDckIsUUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNsQixRQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDOztBQUVwQixRQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDO0FBQ3BDLGNBQVMsRUFBRSxTQUFTO0FBQ3BCLGNBQVMsRUFBRSxTQUFTO0tBQ3BCLENBQUMsQ0FBQyxDQUFDOztBQUVKLFFBQUksQ0FBQyxDQUFDLDhCQUFpQixDQUNyQixXQUFXLHlCQUFZLENBQ3ZCLE1BQU0seURBQWdCLEdBQUcsQ0FBQyxVQUFVLG1CQUFNLHNCQUFTLENBQ25ELFFBQVEseUJBQVksQ0FBQztJQUN2QixNQUFNO0FBQ04sUUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNsQixRQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ3BCOztBQUVELE9BQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxHQUFHLENBQUMsU0FBUyxDQUFDO0dBQ3RDOzs7O0FBSUQsUUFBTSxFQUFFLFVBQVUsSUFBSSxFQUFFO0FBQ3ZCLE9BQUksSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0FBQzdDLE9BQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztHQUNwQzs7O0FBR0QsUUFBTSxFQUFFLFlBQVk7QUFDbkIsT0FBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLGlCQUFJLENBQUM7QUFDcEIsTUFBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztHQUNsQzs7QUFFRCxXQUFTLEVBQUUsVUFBVSxJQUFJLEVBQUU7QUFDMUIsT0FBSSxDQUFDLE9BQU8sd0JBQVcsQ0FBQztHQUN4Qjs7QUFFRCxXQUFTLEVBQUUsWUFBWTtBQUN0QixNQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO0dBQ3JDOzs7QUFHRCxlQUFhLEVBQUUsWUFBWTtBQUMxQixVQUFPO0FBQ04sU0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxFQUFFO0FBQy9CLFNBQUssRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRTtBQUM1QixhQUFTLEVBQUUsS0FBSztJQUNoQixDQUFDO0dBQ0Y7Ozs7QUFJRCxlQUFhLEVBQUUsVUFBVSxDQUFDLEVBQUU7QUFDM0IsT0FBSSx1QkFBQSxDQUFDLENBQUMsS0FBSyxFQUFLLFNBQVMsS0FBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO0FBQ3RELE9BQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDO0FBQ3ZDLFFBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxpQkFBSSxDQUFDO0lBQ3BCO0dBQ0Q7OztBQUdELGdCQUFjLEVBQUUsWUFBWTtBQUMzQixJQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLHlCQUFZLENBQUM7QUFDM0MsVUFBTyxLQUFLLENBQUM7R0FDYjs7QUFFRCxtQkFBaUIsRUFBRSxZQUFZO0FBQzlCLE9BQUksU0FBUyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDOztBQUV6QyxNQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLElBQUksRUFBRTtBQUM5QixRQUFJLENBQUMsSUFBSSxDQUFDO0FBQ1QsY0FBUyxFQUFFLFNBQVM7S0FDcEIsQ0FBQyxDQUFDO0lBQ0gsQ0FBQyxDQUFDO0dBQ0g7RUFDRCxDQUFDLENBQUM7Q0FDSCxDQUFBLENBQUUsTUFBTSxDQUFDLENBQUMiLCJmaWxlIjoiYXBwLXZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKmdsb2JhbCBCYWNrYm9uZSwgalF1ZXJ5LCBfLCBFTlRFUl9LRVkgKi9cbnZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0Ly8gVGhlIEFwcGxpY2F0aW9uXG5cdC8vIC0tLS0tLS0tLS0tLS0tLVxuXG5cdC8vIE91ciBvdmVyYWxsICoqQXBwVmlldyoqIGlzIHRoZSB0b3AtbGV2ZWwgcGllY2Ugb2YgVUkuXG5cdGFwcC5BcHBWaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuXG5cdFx0Ly8gSW5zdGVhZCBvZiBnZW5lcmF0aW5nIGEgbmV3IGVsZW1lbnQsIGJpbmQgdG8gdGhlIGV4aXN0aW5nIHNrZWxldG9uIG9mXG5cdFx0Ly8gdGhlIEFwcCBhbHJlYWR5IHByZXNlbnQgaW4gdGhlIEhUTUwuXG5cdFx0ZWw6ICcudG9kb2FwcCcsXG5cblx0XHQvLyBPdXIgdGVtcGxhdGUgZm9yIHRoZSBsaW5lIG9mIHN0YXRpc3RpY3MgYXQgdGhlIGJvdHRvbSBvZiB0aGUgYXBwLlxuXHRcdHN0YXRzVGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI3N0YXRzLXRlbXBsYXRlJykuaHRtbCgpKSxcblxuXHRcdC8vIERlbGVnYXRlZCBldmVudHMgZm9yIGNyZWF0aW5nIG5ldyBpdGVtcywgYW5kIGNsZWFyaW5nIGNvbXBsZXRlZCBvbmVzLlxuXHRcdGV2ZW50czoge1xuXHRcdFx0J2tleXByZXNzIC5uZXctdG9kbyc6ICdjcmVhdGVPbkVudGVyJyxcblx0XHRcdCdjbGljayAuY2xlYXItY29tcGxldGVkJzogJ2NsZWFyQ29tcGxldGVkJyxcblx0XHRcdCdjbGljayAudG9nZ2xlLWFsbCc6ICd0b2dnbGVBbGxDb21wbGV0ZSdcblx0XHR9LFxuXG5cdFx0Ly8gQXQgaW5pdGlhbGl6YXRpb24gd2UgYmluZCB0byB0aGUgcmVsZXZhbnQgZXZlbnRzIG9uIHRoZSBgVG9kb3NgXG5cdFx0Ly8gY29sbGVjdGlvbiwgd2hlbiBpdGVtcyBhcmUgYWRkZWQgb3IgY2hhbmdlZC4gS2ljayB0aGluZ3Mgb2ZmIGJ5XG5cdFx0Ly8gbG9hZGluZyBhbnkgcHJlZXhpc3RpbmcgdG9kb3MgdGhhdCBtaWdodCBiZSBzYXZlZCBpbiAqbG9jYWxTdG9yYWdlKi5cblx0XHRpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHR0aGlzLmFsbENoZWNrYm94ID0gdGhpcy4kKCcudG9nZ2xlLWFsbCcpWzBdO1xuXHRcdFx0dGhpcy4kaW5wdXQgPSB0aGlzLiQoJy5uZXctdG9kbycpO1xuXHRcdFx0dGhpcy4kZm9vdGVyID0gdGhpcy4kKCcuZm9vdGVyJyk7XG5cdFx0XHR0aGlzLiRtYWluID0gdGhpcy4kKCcubWFpbicpO1xuXHRcdFx0dGhpcy4kbGlzdCA9ICQoJy50b2RvLWxpc3QnKTtcblxuXHRcdFx0dGhpcy5saXN0ZW5UbyhhcHAudG9kb3MsICdhZGQnLCB0aGlzLmFkZE9uZSk7XG5cdFx0XHR0aGlzLmxpc3RlblRvKGFwcC50b2RvcywgJ3Jlc2V0JywgdGhpcy5hZGRBbGwpO1xuXHRcdFx0dGhpcy5saXN0ZW5UbyhhcHAudG9kb3MsICdjaGFuZ2U6Y29tcGxldGVkJywgdGhpcy5maWx0ZXJPbmUpO1xuXHRcdFx0dGhpcy5saXN0ZW5UbyhhcHAudG9kb3MsICdmaWx0ZXInLCB0aGlzLmZpbHRlckFsbCk7XG5cdFx0XHR0aGlzLmxpc3RlblRvKGFwcC50b2RvcywgJ2FsbCcsIF8uZGVib3VuY2UodGhpcy5yZW5kZXIsIDApKTtcblxuXHRcdFx0Ly8gU3VwcHJlc3NlcyAnYWRkJyBldmVudHMgd2l0aCB7cmVzZXQ6IHRydWV9IGFuZCBwcmV2ZW50cyB0aGUgYXBwIHZpZXdcblx0XHRcdC8vIGZyb20gYmVpbmcgcmUtcmVuZGVyZWQgZm9yIGV2ZXJ5IG1vZGVsLiBPbmx5IHJlbmRlcnMgd2hlbiB0aGUgJ3Jlc2V0J1xuXHRcdFx0Ly8gZXZlbnQgaXMgdHJpZ2dlcmVkIGF0IHRoZSBlbmQgb2YgdGhlIGZldGNoLlxuXHRcdFx0YXBwLnRvZG9zLmZldGNoKHtyZXNldDogdHJ1ZX0pO1xuXHRcdH0sXG5cblx0XHQvLyBSZS1yZW5kZXJpbmcgdGhlIEFwcCBqdXN0IG1lYW5zIHJlZnJlc2hpbmcgdGhlIHN0YXRpc3RpY3MgLS0gdGhlIHJlc3Rcblx0XHQvLyBvZiB0aGUgYXBwIGRvZXNuJ3QgY2hhbmdlLlxuXHRcdHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIGNvbXBsZXRlZCA9IGFwcC50b2Rvcy5jb21wbGV0ZWQoKS5sZW5ndGg7XG5cdFx0XHR2YXIgcmVtYWluaW5nID0gYXBwLnRvZG9zLnJlbWFpbmluZygpLmxlbmd0aDtcblxuXHRcdFx0aWYgKGFwcC50b2Rvcy5sZW5ndGgpIHtcblx0XHRcdFx0dGhpcy4kbWFpbi5zaG93KCk7XG5cdFx0XHRcdHRoaXMuJGZvb3Rlci5zaG93KCk7XG5cblx0XHRcdFx0dGhpcy4kZm9vdGVyLmh0bWwodGhpcy5zdGF0c1RlbXBsYXRlKHtcblx0XHRcdFx0XHRjb21wbGV0ZWQ6IGNvbXBsZXRlZCxcblx0XHRcdFx0XHRyZW1haW5pbmc6IHJlbWFpbmluZ1xuXHRcdFx0XHR9KSk7XG5cblx0XHRcdFx0dGhpcy4kKCcuZmlsdGVycyBsaSBhJylcblx0XHRcdFx0XHQucmVtb3ZlQ2xhc3MoJ3NlbGVjdGVkJylcblx0XHRcdFx0XHQuZmlsdGVyKCdbaHJlZj1cIiMvJyArIChhcHAuVG9kb0ZpbHRlciB8fCAnJykgKyAnXCJdJylcblx0XHRcdFx0XHQuYWRkQ2xhc3MoJ3NlbGVjdGVkJyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLiRtYWluLmhpZGUoKTtcblx0XHRcdFx0dGhpcy4kZm9vdGVyLmhpZGUoKTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5hbGxDaGVja2JveC5jaGVja2VkID0gIXJlbWFpbmluZztcblx0XHR9LFxuXG5cdFx0Ly8gQWRkIGEgc2luZ2xlIHRvZG8gaXRlbSB0byB0aGUgbGlzdCBieSBjcmVhdGluZyBhIHZpZXcgZm9yIGl0LCBhbmRcblx0XHQvLyBhcHBlbmRpbmcgaXRzIGVsZW1lbnQgdG8gdGhlIGA8dWw+YC5cblx0XHRhZGRPbmU6IGZ1bmN0aW9uICh0b2RvKSB7XG5cdFx0XHR2YXIgdmlldyA9IG5ldyBhcHAuVG9kb1ZpZXcoeyBtb2RlbDogdG9kbyB9KTtcblx0XHRcdHRoaXMuJGxpc3QuYXBwZW5kKHZpZXcucmVuZGVyKCkuZWwpO1xuXHRcdH0sXG5cblx0XHQvLyBBZGQgYWxsIGl0ZW1zIGluIHRoZSAqKlRvZG9zKiogY29sbGVjdGlvbiBhdCBvbmNlLlxuXHRcdGFkZEFsbDogZnVuY3Rpb24gKCkge1xuXHRcdFx0dGhpcy4kbGlzdC5odG1sKCcnKTtcblx0XHRcdGFwcC50b2Rvcy5lYWNoKHRoaXMuYWRkT25lLCB0aGlzKTtcblx0XHR9LFxuXG5cdFx0ZmlsdGVyT25lOiBmdW5jdGlvbiAodG9kbykge1xuXHRcdFx0dG9kby50cmlnZ2VyKCd2aXNpYmxlJyk7XG5cdFx0fSxcblxuXHRcdGZpbHRlckFsbDogZnVuY3Rpb24gKCkge1xuXHRcdFx0YXBwLnRvZG9zLmVhY2godGhpcy5maWx0ZXJPbmUsIHRoaXMpO1xuXHRcdH0sXG5cblx0XHQvLyBHZW5lcmF0ZSB0aGUgYXR0cmlidXRlcyBmb3IgYSBuZXcgVG9kbyBpdGVtLlxuXHRcdG5ld0F0dHJpYnV0ZXM6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHRpdGxlOiB0aGlzLiRpbnB1dC52YWwoKS50cmltKCksXG5cdFx0XHRcdG9yZGVyOiBhcHAudG9kb3MubmV4dE9yZGVyKCksXG5cdFx0XHRcdGNvbXBsZXRlZDogZmFsc2Vcblx0XHRcdH07XG5cdFx0fSxcblxuXHRcdC8vIElmIHlvdSBoaXQgcmV0dXJuIGluIHRoZSBtYWluIGlucHV0IGZpZWxkLCBjcmVhdGUgbmV3ICoqVG9kbyoqIG1vZGVsLFxuXHRcdC8vIHBlcnNpc3RpbmcgaXQgdG8gKmxvY2FsU3RvcmFnZSouXG5cdFx0Y3JlYXRlT25FbnRlcjogZnVuY3Rpb24gKGUpIHtcblx0XHRcdGlmIChlLndoaWNoID09PSBFTlRFUl9LRVkgJiYgdGhpcy4kaW5wdXQudmFsKCkudHJpbSgpKSB7XG5cdFx0XHRcdGFwcC50b2Rvcy5jcmVhdGUodGhpcy5uZXdBdHRyaWJ1dGVzKCkpO1xuXHRcdFx0XHR0aGlzLiRpbnB1dC52YWwoJycpO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHQvLyBDbGVhciBhbGwgY29tcGxldGVkIHRvZG8gaXRlbXMsIGRlc3Ryb3lpbmcgdGhlaXIgbW9kZWxzLlxuXHRcdGNsZWFyQ29tcGxldGVkOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRfLmludm9rZShhcHAudG9kb3MuY29tcGxldGVkKCksICdkZXN0cm95Jyk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fSxcblxuXHRcdHRvZ2dsZUFsbENvbXBsZXRlOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgY29tcGxldGVkID0gdGhpcy5hbGxDaGVja2JveC5jaGVja2VkO1xuXG5cdFx0XHRhcHAudG9kb3MuZWFjaChmdW5jdGlvbiAodG9kbykge1xuXHRcdFx0XHR0b2RvLnNhdmUoe1xuXHRcdFx0XHRcdGNvbXBsZXRlZDogY29tcGxldGVkXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9KTtcbn0pKGpRdWVyeSk7XG4iXX0=