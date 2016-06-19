/*global Backbone, jQuery, _, ENTER_KEY, ESC_KEY */
var app = app || {};

(function ($) {
	'use strict'

	// Todo Item View
	// --------------

	// The DOM element for a todo item...
	;
	app.TodoView = Backbone.View.extend({
		//... is a list tag.
		tagName: stringTrace('li'),

		// Cache the template function for a single item.
		template: _.template($(stringTrace('#item-template')).html()),

		// The DOM events specific to an item.
		events: {
			'click .toggle': stringTrace('toggleCompleted'),
			'dblclick label': stringTrace('edit'),
			'click .destroy': stringTrace('clear'),
			'keypress .edit': stringTrace('updateOnEnter'),
			'keydown .edit': stringTrace('revertOnEscape'),
			'blur .edit': stringTrace('close')
		},

		// The TodoView listens for changes to its model, re-rendering. Since
		// there's a one-to-one correspondence between a **Todo** and a
		// **TodoView** in this app, we set a direct reference on the model for
		// convenience.
		initialize: function () {
			this.listenTo(this.model, stringTrace('change'), this.render);
			this.listenTo(this.model, stringTrace('destroy'), this.remove);
			this.listenTo(this.model, stringTrace('visible'), this.toggleVisible);
		},

		// Re-render the titles of the todo item.
		render: function () {
			// Backbone LocalStorage is adding `id` attribute instantly after
			// creating a model.  This causes our TodoView to render twice. Once
			// after creating a model and once on `id` change.  We want to
			// filter out the second redundant render, which is caused by this
			// `id` change.  It's known Backbone LocalStorage bug, therefore
			// we've to create a workaround.
			// https://github.com/tastejs/todomvc/issues/469
			if (stringTraceNotTripleEqual(this.model.changed.id, undefined)) {
				return;
			}

			this.$el.html(this.template(this.model.toJSON()));
			this.$el.toggleClass(stringTrace('completed'), this.model.get(stringTrace('completed')));
			this.toggleVisible();
			this.$input = this.$(stringTrace('.edit'));
			return this;
		},

		toggleVisible: function () {
			this.$el.toggleClass(stringTrace('hidden'), this.isHidden());
		},

		isHidden: function () {
			return stringTraceUseValue(this.model.get(stringTrace('completed'))) ? stringTraceTripleEqual(app.TodoFilter, stringTrace('active')) : stringTraceTripleEqual(app.TodoFilter, stringTrace('completed'));
		},

		// Toggle the `"completed"` state of the model.
		toggleCompleted: function () {
			this.model.toggle();
		},

		// Switch this view into `"editing"` mode, displaying the input field.
		edit: function () {
			this.$el.addClass(stringTrace('editing'));
			this.$input.focus();
		},

		// Close the `"editing"` mode, saving changes to the todo.
		close: function () {
			var value = this.$input.val();
			var trimmedValue = value.trim();

			// We don't want to handle blur events from an item that is no
			// longer being edited. Relying on the CSS class here has the
			// benefit of us not having to maintain state in the DOM and the
			// JavaScript logic.
			if (!this.$el.hasClass(stringTrace('editing'))) {
				return;
			}

			if (trimmedValue) {
				this.model.save({ title: trimmedValue });
			} else {
				this.clear();
			}

			this.$el.removeClass(stringTrace('editing'));
		},

		// If you hit `enter`, we're through editing the item.
		updateOnEnter: function (e) {
			if (stringTraceTripleEqual(e.which, ENTER_KEY)) {
				this.close();
			}
		},

		// If you're pressing `escape` we revert your change by simply leaving
		// the `editing` state.
		revertOnEscape: function (e) {
			if (stringTraceTripleEqual(e.which, ESC_KEY)) {
				this.$el.removeClass(stringTrace('editing'));
				// Also reset the hidden input back to the original value.
				this.$input.val(this.model.get(stringTrace('title')));
			}
		},

		// Remove the item, destroy the model from *localStorage* and delete its view.
		clear: function () {
			this.model.destroy();
		}
	});
})(jQuery);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRvZG8tdmlldy1vcmlnaW5hbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQ0EsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEVBQUUsQ0FBQzs7QUFFcEIsQ0FBQyxVQUFVLENBQUMsRUFBRTtBQUNiOzs7Ozs7QUFBWSxFQUFDO0FBTWIsSUFBRyxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQzs7QUFFbkMsU0FBTyxFQUFHLGlCQUFJOzs7QUFHZCxVQUFRLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsNkJBQWdCLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQzs7O0FBR2hELFFBQU0sRUFBRTtBQUNQLGtCQUFlLEVBQUUsOEJBQWlCO0FBQ2xDLG1CQUFnQixFQUFFLG1CQUFNO0FBQ3hCLG1CQUFnQixFQUFFLG9CQUFPO0FBQ3pCLG1CQUFnQixFQUFFLDRCQUFlO0FBQ2pDLGtCQUFlLEVBQUUsNkJBQWdCO0FBQ2pDLGVBQVksRUFBRSxvQkFBTztHQUNyQjs7Ozs7O0FBTUQsWUFBVSxFQUFFLFlBQVk7QUFDdkIsT0FBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLHFCQUFRLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2pELE9BQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxzQkFBUyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNsRCxPQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsc0JBQVMsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7R0FDekQ7OztBQUdELFFBQU0sRUFBRSxZQUFZOzs7Ozs7OztBQVFuQixpQ0FBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUssU0FBUyxHQUFFO0FBQ3hDLFdBQU87SUFDUDs7QUFFRCxPQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ2xELE9BQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLHdCQUFXLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsd0JBQVcsQ0FBQyxDQUFDLENBQUM7QUFDL0QsT0FBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO0FBQ3JCLE9BQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxvQkFBTyxDQUFDLENBQUM7QUFDOUIsVUFBTyxJQUFJLENBQUM7R0FDWjs7QUFFRCxlQUFhLEVBQUUsWUFBWTtBQUMxQixPQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxxQkFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0dBQ2hEOztBQUVELFVBQVEsRUFBRSxZQUFZO0FBQ3JCLDhCQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLHdCQUFXLENBQUMsMkJBQ2pDLEdBQUcsQ0FBQyxVQUFVLEVBQUsscUJBQVEsMkJBQzNCLEdBQUcsQ0FBQyxVQUFVLEVBQUssd0JBQVcsRUFBQztHQUNoQzs7O0FBR0QsaUJBQWUsRUFBRSxZQUFZO0FBQzVCLE9BQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7R0FDcEI7OztBQUdELE1BQUksRUFBRSxZQUFZO0FBQ2pCLE9BQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLHNCQUFTLENBQUMsQ0FBQztBQUM3QixPQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO0dBQ3BCOzs7QUFHRCxPQUFLLEVBQUUsWUFBWTtBQUNsQixPQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQzlCLE9BQUksWUFBWSxHQUFHLEtBQUssQ0FBQyxJQUFJLEVBQUU7Ozs7OztBQUFDLEFBTWhDLE9BQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxzQkFBUyxDQUFDLEVBQUU7QUFDbEMsV0FBTztJQUNQOztBQUVELE9BQUksWUFBWSxFQUFFO0FBQ2pCLFFBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxDQUFDLENBQUM7SUFDekMsTUFBTTtBQUNOLFFBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNiOztBQUVELE9BQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLHNCQUFTLENBQUMsQ0FBQztHQUNoQzs7O0FBR0QsZUFBYSxFQUFFLFVBQVUsQ0FBQyxFQUFFO0FBQzNCLDhCQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUssU0FBUyxHQUFFO0FBQzFCLFFBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNiO0dBQ0Q7Ozs7QUFJRCxnQkFBYyxFQUFFLFVBQVUsQ0FBQyxFQUFFO0FBQzVCLDhCQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUssT0FBTyxHQUFFO0FBQ3hCLFFBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLHNCQUFTLENBQUM7O0FBQUMsQUFFaEMsUUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsb0JBQU8sQ0FBQyxDQUFDLENBQUM7SUFDekM7R0FDRDs7O0FBR0QsT0FBSyxFQUFFLFlBQVk7QUFDbEIsT0FBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztHQUNyQjtFQUNELENBQUMsQ0FBQztDQUNILENBQUEsQ0FBRSxNQUFNLENBQUMsQ0FBQyIsImZpbGUiOiJ0b2RvLXZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKmdsb2JhbCBCYWNrYm9uZSwgalF1ZXJ5LCBfLCBFTlRFUl9LRVksIEVTQ19LRVkgKi9cbnZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0Ly8gVG9kbyBJdGVtIFZpZXdcblx0Ly8gLS0tLS0tLS0tLS0tLS1cblxuXHQvLyBUaGUgRE9NIGVsZW1lbnQgZm9yIGEgdG9kbyBpdGVtLi4uXG5cdGFwcC5Ub2RvVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcblx0XHQvLy4uLiBpcyBhIGxpc3QgdGFnLlxuXHRcdHRhZ05hbWU6ICAnbGknLFxuXG5cdFx0Ly8gQ2FjaGUgdGhlIHRlbXBsYXRlIGZ1bmN0aW9uIGZvciBhIHNpbmdsZSBpdGVtLlxuXHRcdHRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNpdGVtLXRlbXBsYXRlJykuaHRtbCgpKSxcblxuXHRcdC8vIFRoZSBET00gZXZlbnRzIHNwZWNpZmljIHRvIGFuIGl0ZW0uXG5cdFx0ZXZlbnRzOiB7XG5cdFx0XHQnY2xpY2sgLnRvZ2dsZSc6ICd0b2dnbGVDb21wbGV0ZWQnLFxuXHRcdFx0J2RibGNsaWNrIGxhYmVsJzogJ2VkaXQnLFxuXHRcdFx0J2NsaWNrIC5kZXN0cm95JzogJ2NsZWFyJyxcblx0XHRcdCdrZXlwcmVzcyAuZWRpdCc6ICd1cGRhdGVPbkVudGVyJyxcblx0XHRcdCdrZXlkb3duIC5lZGl0JzogJ3JldmVydE9uRXNjYXBlJyxcblx0XHRcdCdibHVyIC5lZGl0JzogJ2Nsb3NlJ1xuXHRcdH0sXG5cblx0XHQvLyBUaGUgVG9kb1ZpZXcgbGlzdGVucyBmb3IgY2hhbmdlcyB0byBpdHMgbW9kZWwsIHJlLXJlbmRlcmluZy4gU2luY2Vcblx0XHQvLyB0aGVyZSdzIGEgb25lLXRvLW9uZSBjb3JyZXNwb25kZW5jZSBiZXR3ZWVuIGEgKipUb2RvKiogYW5kIGFcblx0XHQvLyAqKlRvZG9WaWV3KiogaW4gdGhpcyBhcHAsIHdlIHNldCBhIGRpcmVjdCByZWZlcmVuY2Ugb24gdGhlIG1vZGVsIGZvclxuXHRcdC8vIGNvbnZlbmllbmNlLlxuXHRcdGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgJ2NoYW5nZScsIHRoaXMucmVuZGVyKTtcblx0XHRcdHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgJ2Rlc3Ryb3knLCB0aGlzLnJlbW92ZSk7XG5cdFx0XHR0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsICd2aXNpYmxlJywgdGhpcy50b2dnbGVWaXNpYmxlKTtcblx0XHR9LFxuXG5cdFx0Ly8gUmUtcmVuZGVyIHRoZSB0aXRsZXMgb2YgdGhlIHRvZG8gaXRlbS5cblx0XHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblx0XHRcdC8vIEJhY2tib25lIExvY2FsU3RvcmFnZSBpcyBhZGRpbmcgYGlkYCBhdHRyaWJ1dGUgaW5zdGFudGx5IGFmdGVyXG5cdFx0XHQvLyBjcmVhdGluZyBhIG1vZGVsLiAgVGhpcyBjYXVzZXMgb3VyIFRvZG9WaWV3IHRvIHJlbmRlciB0d2ljZS4gT25jZVxuXHRcdFx0Ly8gYWZ0ZXIgY3JlYXRpbmcgYSBtb2RlbCBhbmQgb25jZSBvbiBgaWRgIGNoYW5nZS4gIFdlIHdhbnQgdG9cblx0XHRcdC8vIGZpbHRlciBvdXQgdGhlIHNlY29uZCByZWR1bmRhbnQgcmVuZGVyLCB3aGljaCBpcyBjYXVzZWQgYnkgdGhpc1xuXHRcdFx0Ly8gYGlkYCBjaGFuZ2UuICBJdCdzIGtub3duIEJhY2tib25lIExvY2FsU3RvcmFnZSBidWcsIHRoZXJlZm9yZVxuXHRcdFx0Ly8gd2UndmUgdG8gY3JlYXRlIGEgd29ya2Fyb3VuZC5cblx0XHRcdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS90YXN0ZWpzL3RvZG9tdmMvaXNzdWVzLzQ2OVxuXHRcdFx0aWYgKHRoaXMubW9kZWwuY2hhbmdlZC5pZCAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy4kZWwuaHRtbCh0aGlzLnRlbXBsYXRlKHRoaXMubW9kZWwudG9KU09OKCkpKTtcblx0XHRcdHRoaXMuJGVsLnRvZ2dsZUNsYXNzKCdjb21wbGV0ZWQnLCB0aGlzLm1vZGVsLmdldCgnY29tcGxldGVkJykpO1xuXHRcdFx0dGhpcy50b2dnbGVWaXNpYmxlKCk7XG5cdFx0XHR0aGlzLiRpbnB1dCA9IHRoaXMuJCgnLmVkaXQnKTtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH0sXG5cblx0XHR0b2dnbGVWaXNpYmxlOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHR0aGlzLiRlbC50b2dnbGVDbGFzcygnaGlkZGVuJywgdGhpcy5pc0hpZGRlbigpKTtcblx0XHR9LFxuXG5cdFx0aXNIaWRkZW46IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiB0aGlzLm1vZGVsLmdldCgnY29tcGxldGVkJykgP1xuXHRcdFx0XHRhcHAuVG9kb0ZpbHRlciA9PT0gJ2FjdGl2ZScgOlxuXHRcdFx0XHRhcHAuVG9kb0ZpbHRlciA9PT0gJ2NvbXBsZXRlZCc7XG5cdFx0fSxcblxuXHRcdC8vIFRvZ2dsZSB0aGUgYFwiY29tcGxldGVkXCJgIHN0YXRlIG9mIHRoZSBtb2RlbC5cblx0XHR0b2dnbGVDb21wbGV0ZWQ6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHRoaXMubW9kZWwudG9nZ2xlKCk7XG5cdFx0fSxcblxuXHRcdC8vIFN3aXRjaCB0aGlzIHZpZXcgaW50byBgXCJlZGl0aW5nXCJgIG1vZGUsIGRpc3BsYXlpbmcgdGhlIGlucHV0IGZpZWxkLlxuXHRcdGVkaXQ6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKCdlZGl0aW5nJyk7XG5cdFx0XHR0aGlzLiRpbnB1dC5mb2N1cygpO1xuXHRcdH0sXG5cblx0XHQvLyBDbG9zZSB0aGUgYFwiZWRpdGluZ1wiYCBtb2RlLCBzYXZpbmcgY2hhbmdlcyB0byB0aGUgdG9kby5cblx0XHRjbG9zZTogZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIHZhbHVlID0gdGhpcy4kaW5wdXQudmFsKCk7XG5cdFx0XHR2YXIgdHJpbW1lZFZhbHVlID0gdmFsdWUudHJpbSgpO1xuXG5cdFx0XHQvLyBXZSBkb24ndCB3YW50IHRvIGhhbmRsZSBibHVyIGV2ZW50cyBmcm9tIGFuIGl0ZW0gdGhhdCBpcyBub1xuXHRcdFx0Ly8gbG9uZ2VyIGJlaW5nIGVkaXRlZC4gUmVseWluZyBvbiB0aGUgQ1NTIGNsYXNzIGhlcmUgaGFzIHRoZVxuXHRcdFx0Ly8gYmVuZWZpdCBvZiB1cyBub3QgaGF2aW5nIHRvIG1haW50YWluIHN0YXRlIGluIHRoZSBET00gYW5kIHRoZVxuXHRcdFx0Ly8gSmF2YVNjcmlwdCBsb2dpYy5cblx0XHRcdGlmICghdGhpcy4kZWwuaGFzQ2xhc3MoJ2VkaXRpbmcnKSkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGlmICh0cmltbWVkVmFsdWUpIHtcblx0XHRcdFx0dGhpcy5tb2RlbC5zYXZlKHsgdGl0bGU6IHRyaW1tZWRWYWx1ZSB9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuY2xlYXIoKTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoJ2VkaXRpbmcnKTtcblx0XHR9LFxuXG5cdFx0Ly8gSWYgeW91IGhpdCBgZW50ZXJgLCB3ZSdyZSB0aHJvdWdoIGVkaXRpbmcgdGhlIGl0ZW0uXG5cdFx0dXBkYXRlT25FbnRlcjogZnVuY3Rpb24gKGUpIHtcblx0XHRcdGlmIChlLndoaWNoID09PSBFTlRFUl9LRVkpIHtcblx0XHRcdFx0dGhpcy5jbG9zZSgpO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHQvLyBJZiB5b3UncmUgcHJlc3NpbmcgYGVzY2FwZWAgd2UgcmV2ZXJ0IHlvdXIgY2hhbmdlIGJ5IHNpbXBseSBsZWF2aW5nXG5cdFx0Ly8gdGhlIGBlZGl0aW5nYCBzdGF0ZS5cblx0XHRyZXZlcnRPbkVzY2FwZTogZnVuY3Rpb24gKGUpIHtcblx0XHRcdGlmIChlLndoaWNoID09PSBFU0NfS0VZKSB7XG5cdFx0XHRcdHRoaXMuJGVsLnJlbW92ZUNsYXNzKCdlZGl0aW5nJyk7XG5cdFx0XHRcdC8vIEFsc28gcmVzZXQgdGhlIGhpZGRlbiBpbnB1dCBiYWNrIHRvIHRoZSBvcmlnaW5hbCB2YWx1ZS5cblx0XHRcdFx0dGhpcy4kaW5wdXQudmFsKHRoaXMubW9kZWwuZ2V0KCd0aXRsZScpKTtcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0Ly8gUmVtb3ZlIHRoZSBpdGVtLCBkZXN0cm95IHRoZSBtb2RlbCBmcm9tICpsb2NhbFN0b3JhZ2UqIGFuZCBkZWxldGUgaXRzIHZpZXcuXG5cdFx0Y2xlYXI6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHRoaXMubW9kZWwuZGVzdHJveSgpO1xuXHRcdH1cblx0fSk7XG59KShqUXVlcnkpO1xuIl19