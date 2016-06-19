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
		tagName: 'li',

		// Cache the template function for a single item.
		template: _.template($(stringTrace('#item-template')).html()),

		// The DOM events specific to an item.
		events: {
			'click .toggle': 'toggleCompleted',
			'dblclick label': 'edit',
			'click .destroy': 'clear',
			'keypress .edit': 'updateOnEnter',
			'keydown .edit': 'revertOnEscape',
			'blur .edit': 'close'
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRvZG8tdmlldy1vcmlnaW5hbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQ0EsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEVBQUUsQ0FBQzs7QUFFcEIsQ0FBQyxVQUFVLENBQUMsRUFBRTtBQUNiOzs7Ozs7QUFBWSxFQUFDO0FBTWIsSUFBRyxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQzs7QUFFbkMsU0FBTyxFQUFHLElBQUk7OztBQUdkLFVBQVEsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsK0JBQWtCLENBQUMsSUFBSSxFQUFFLENBQUM7OztBQUdoRCxRQUFNLEVBQUU7QUFDUCxrQkFBZSxFQUFFLGlCQUFpQjtBQUNsQyxtQkFBZ0IsRUFBRSxNQUFNO0FBQ3hCLG1CQUFnQixFQUFFLE9BQU87QUFDekIsbUJBQWdCLEVBQUUsZUFBZTtBQUNqQyxrQkFBZSxFQUFFLGdCQUFnQjtBQUNqQyxlQUFZLEVBQUUsT0FBTztHQUNyQjs7Ozs7O0FBTUQsWUFBVSxFQUFFLFlBQVk7QUFDdkIsT0FBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyx5QkFBWSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDakQsT0FBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSywwQkFBYSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDbEQsT0FBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSywwQkFBYSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7R0FDekQ7OztBQUdELFFBQU0sRUFBRSxZQUFZOzs7Ozs7OztBQVFuQixpQ0FBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUssU0FBUyxHQUFFO0FBQ3hDLFdBQU87SUFDUDs7QUFFRCxPQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ2xELE9BQUksQ0FBQyxHQUFHLENBQUMsV0FBVywyQkFBYyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsMEJBQWEsQ0FBQyxDQUFDO0FBQy9ELE9BQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztBQUNyQixPQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxDQUFDLHNCQUFTLENBQUM7QUFDOUIsVUFBTyxJQUFJLENBQUM7R0FDWjs7QUFFRCxlQUFhLEVBQUUsWUFBWTtBQUMxQixPQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsd0JBQVcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7R0FDaEQ7O0FBRUQsVUFBUSxFQUFFLFlBQVk7QUFDckIsOEJBQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLDBCQUFhLDJCQUNqQyxHQUFHLENBQUMsVUFBVSxrREFDZCxHQUFHLENBQUMsVUFBVSw0QkFBaUI7R0FDaEM7OztBQUdELGlCQUFlLEVBQUUsWUFBWTtBQUM1QixPQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO0dBQ3BCOzs7QUFHRCxNQUFJLEVBQUUsWUFBWTtBQUNqQixPQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsd0JBQVcsQ0FBQztBQUM3QixPQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO0dBQ3BCOzs7QUFHRCxPQUFLLEVBQUUsWUFBWTtBQUNsQixPQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQzlCLE9BQUksWUFBWSxHQUFHLEtBQUssQ0FBQyxJQUFJLEVBQUU7Ozs7OztBQUFDLEFBTWhDLE9BQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsd0JBQVcsRUFBRTtBQUNsQyxXQUFPO0lBQ1A7O0FBRUQsT0FBSSxZQUFZLEVBQUU7QUFDakIsUUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQztJQUN6QyxNQUFNO0FBQ04sUUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ2I7O0FBRUQsT0FBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLHdCQUFXLENBQUM7R0FDaEM7OztBQUdELGVBQWEsRUFBRSxVQUFVLENBQUMsRUFBRTtBQUMzQiw4QkFBSSxDQUFDLENBQUMsS0FBSyxFQUFLLFNBQVMsR0FBRTtBQUMxQixRQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDYjtHQUNEOzs7O0FBSUQsZ0JBQWMsRUFBRSxVQUFVLENBQUMsRUFBRTtBQUM1Qiw4QkFBSSxDQUFDLENBQUMsS0FBSyxFQUFLLE9BQU8sR0FBRTtBQUN4QixRQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsd0JBQVc7O0FBQUMsQUFFaEMsUUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLHNCQUFTLENBQUMsQ0FBQztJQUN6QztHQUNEOzs7QUFHRCxPQUFLLEVBQUUsWUFBWTtBQUNsQixPQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO0dBQ3JCO0VBQ0QsQ0FBQyxDQUFDO0NBQ0gsQ0FBQSxDQUFFLE1BQU0sQ0FBQyxDQUFDIiwiZmlsZSI6InRvZG8tdmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qZ2xvYmFsIEJhY2tib25lLCBqUXVlcnksIF8sIEVOVEVSX0tFWSwgRVNDX0tFWSAqL1xudmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgkKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHQvLyBUb2RvIEl0ZW0gVmlld1xuXHQvLyAtLS0tLS0tLS0tLS0tLVxuXG5cdC8vIFRoZSBET00gZWxlbWVudCBmb3IgYSB0b2RvIGl0ZW0uLi5cblx0YXBwLlRvZG9WaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuXHRcdC8vLi4uIGlzIGEgbGlzdCB0YWcuXG5cdFx0dGFnTmFtZTogICdsaScsXG5cblx0XHQvLyBDYWNoZSB0aGUgdGVtcGxhdGUgZnVuY3Rpb24gZm9yIGEgc2luZ2xlIGl0ZW0uXG5cdFx0dGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI2l0ZW0tdGVtcGxhdGUnKS5odG1sKCkpLFxuXG5cdFx0Ly8gVGhlIERPTSBldmVudHMgc3BlY2lmaWMgdG8gYW4gaXRlbS5cblx0XHRldmVudHM6IHtcblx0XHRcdCdjbGljayAudG9nZ2xlJzogJ3RvZ2dsZUNvbXBsZXRlZCcsXG5cdFx0XHQnZGJsY2xpY2sgbGFiZWwnOiAnZWRpdCcsXG5cdFx0XHQnY2xpY2sgLmRlc3Ryb3knOiAnY2xlYXInLFxuXHRcdFx0J2tleXByZXNzIC5lZGl0JzogJ3VwZGF0ZU9uRW50ZXInLFxuXHRcdFx0J2tleWRvd24gLmVkaXQnOiAncmV2ZXJ0T25Fc2NhcGUnLFxuXHRcdFx0J2JsdXIgLmVkaXQnOiAnY2xvc2UnXG5cdFx0fSxcblxuXHRcdC8vIFRoZSBUb2RvVmlldyBsaXN0ZW5zIGZvciBjaGFuZ2VzIHRvIGl0cyBtb2RlbCwgcmUtcmVuZGVyaW5nLiBTaW5jZVxuXHRcdC8vIHRoZXJlJ3MgYSBvbmUtdG8tb25lIGNvcnJlc3BvbmRlbmNlIGJldHdlZW4gYSAqKlRvZG8qKiBhbmQgYVxuXHRcdC8vICoqVG9kb1ZpZXcqKiBpbiB0aGlzIGFwcCwgd2Ugc2V0IGEgZGlyZWN0IHJlZmVyZW5jZSBvbiB0aGUgbW9kZWwgZm9yXG5cdFx0Ly8gY29udmVuaWVuY2UuXG5cdFx0aW5pdGlhbGl6ZTogZnVuY3Rpb24gKCkge1xuXHRcdFx0dGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCAnY2hhbmdlJywgdGhpcy5yZW5kZXIpO1xuXHRcdFx0dGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCAnZGVzdHJveScsIHRoaXMucmVtb3ZlKTtcblx0XHRcdHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgJ3Zpc2libGUnLCB0aGlzLnRvZ2dsZVZpc2libGUpO1xuXHRcdH0sXG5cblx0XHQvLyBSZS1yZW5kZXIgdGhlIHRpdGxlcyBvZiB0aGUgdG9kbyBpdGVtLlxuXHRcdHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXHRcdFx0Ly8gQmFja2JvbmUgTG9jYWxTdG9yYWdlIGlzIGFkZGluZyBgaWRgIGF0dHJpYnV0ZSBpbnN0YW50bHkgYWZ0ZXJcblx0XHRcdC8vIGNyZWF0aW5nIGEgbW9kZWwuICBUaGlzIGNhdXNlcyBvdXIgVG9kb1ZpZXcgdG8gcmVuZGVyIHR3aWNlLiBPbmNlXG5cdFx0XHQvLyBhZnRlciBjcmVhdGluZyBhIG1vZGVsIGFuZCBvbmNlIG9uIGBpZGAgY2hhbmdlLiAgV2Ugd2FudCB0b1xuXHRcdFx0Ly8gZmlsdGVyIG91dCB0aGUgc2Vjb25kIHJlZHVuZGFudCByZW5kZXIsIHdoaWNoIGlzIGNhdXNlZCBieSB0aGlzXG5cdFx0XHQvLyBgaWRgIGNoYW5nZS4gIEl0J3Mga25vd24gQmFja2JvbmUgTG9jYWxTdG9yYWdlIGJ1ZywgdGhlcmVmb3JlXG5cdFx0XHQvLyB3ZSd2ZSB0byBjcmVhdGUgYSB3b3JrYXJvdW5kLlxuXHRcdFx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL3Rhc3RlanMvdG9kb212Yy9pc3N1ZXMvNDY5XG5cdFx0XHRpZiAodGhpcy5tb2RlbC5jaGFuZ2VkLmlkICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLiRlbC5odG1sKHRoaXMudGVtcGxhdGUodGhpcy5tb2RlbC50b0pTT04oKSkpO1xuXHRcdFx0dGhpcy4kZWwudG9nZ2xlQ2xhc3MoJ2NvbXBsZXRlZCcsIHRoaXMubW9kZWwuZ2V0KCdjb21wbGV0ZWQnKSk7XG5cdFx0XHR0aGlzLnRvZ2dsZVZpc2libGUoKTtcblx0XHRcdHRoaXMuJGlucHV0ID0gdGhpcy4kKCcuZWRpdCcpO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fSxcblxuXHRcdHRvZ2dsZVZpc2libGU6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHRoaXMuJGVsLnRvZ2dsZUNsYXNzKCdoaWRkZW4nLCB0aGlzLmlzSGlkZGVuKCkpO1xuXHRcdH0sXG5cblx0XHRpc0hpZGRlbjogZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIHRoaXMubW9kZWwuZ2V0KCdjb21wbGV0ZWQnKSA/XG5cdFx0XHRcdGFwcC5Ub2RvRmlsdGVyID09PSAnYWN0aXZlJyA6XG5cdFx0XHRcdGFwcC5Ub2RvRmlsdGVyID09PSAnY29tcGxldGVkJztcblx0XHR9LFxuXG5cdFx0Ly8gVG9nZ2xlIHRoZSBgXCJjb21wbGV0ZWRcImAgc3RhdGUgb2YgdGhlIG1vZGVsLlxuXHRcdHRvZ2dsZUNvbXBsZXRlZDogZnVuY3Rpb24gKCkge1xuXHRcdFx0dGhpcy5tb2RlbC50b2dnbGUoKTtcblx0XHR9LFxuXG5cdFx0Ly8gU3dpdGNoIHRoaXMgdmlldyBpbnRvIGBcImVkaXRpbmdcImAgbW9kZSwgZGlzcGxheWluZyB0aGUgaW5wdXQgZmllbGQuXG5cdFx0ZWRpdDogZnVuY3Rpb24gKCkge1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoJ2VkaXRpbmcnKTtcblx0XHRcdHRoaXMuJGlucHV0LmZvY3VzKCk7XG5cdFx0fSxcblxuXHRcdC8vIENsb3NlIHRoZSBgXCJlZGl0aW5nXCJgIG1vZGUsIHNhdmluZyBjaGFuZ2VzIHRvIHRoZSB0b2RvLlxuXHRcdGNsb3NlOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgdmFsdWUgPSB0aGlzLiRpbnB1dC52YWwoKTtcblx0XHRcdHZhciB0cmltbWVkVmFsdWUgPSB2YWx1ZS50cmltKCk7XG5cblx0XHRcdC8vIFdlIGRvbid0IHdhbnQgdG8gaGFuZGxlIGJsdXIgZXZlbnRzIGZyb20gYW4gaXRlbSB0aGF0IGlzIG5vXG5cdFx0XHQvLyBsb25nZXIgYmVpbmcgZWRpdGVkLiBSZWx5aW5nIG9uIHRoZSBDU1MgY2xhc3MgaGVyZSBoYXMgdGhlXG5cdFx0XHQvLyBiZW5lZml0IG9mIHVzIG5vdCBoYXZpbmcgdG8gbWFpbnRhaW4gc3RhdGUgaW4gdGhlIERPTSBhbmQgdGhlXG5cdFx0XHQvLyBKYXZhU2NyaXB0IGxvZ2ljLlxuXHRcdFx0aWYgKCF0aGlzLiRlbC5oYXNDbGFzcygnZWRpdGluZycpKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHRyaW1tZWRWYWx1ZSkge1xuXHRcdFx0XHR0aGlzLm1vZGVsLnNhdmUoeyB0aXRsZTogdHJpbW1lZFZhbHVlIH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5jbGVhcigpO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLiRlbC5yZW1vdmVDbGFzcygnZWRpdGluZycpO1xuXHRcdH0sXG5cblx0XHQvLyBJZiB5b3UgaGl0IGBlbnRlcmAsIHdlJ3JlIHRocm91Z2ggZWRpdGluZyB0aGUgaXRlbS5cblx0XHR1cGRhdGVPbkVudGVyOiBmdW5jdGlvbiAoZSkge1xuXHRcdFx0aWYgKGUud2hpY2ggPT09IEVOVEVSX0tFWSkge1xuXHRcdFx0XHR0aGlzLmNsb3NlKCk7XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdC8vIElmIHlvdSdyZSBwcmVzc2luZyBgZXNjYXBlYCB3ZSByZXZlcnQgeW91ciBjaGFuZ2UgYnkgc2ltcGx5IGxlYXZpbmdcblx0XHQvLyB0aGUgYGVkaXRpbmdgIHN0YXRlLlxuXHRcdHJldmVydE9uRXNjYXBlOiBmdW5jdGlvbiAoZSkge1xuXHRcdFx0aWYgKGUud2hpY2ggPT09IEVTQ19LRVkpIHtcblx0XHRcdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoJ2VkaXRpbmcnKTtcblx0XHRcdFx0Ly8gQWxzbyByZXNldCB0aGUgaGlkZGVuIGlucHV0IGJhY2sgdG8gdGhlIG9yaWdpbmFsIHZhbHVlLlxuXHRcdFx0XHR0aGlzLiRpbnB1dC52YWwodGhpcy5tb2RlbC5nZXQoJ3RpdGxlJykpO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHQvLyBSZW1vdmUgdGhlIGl0ZW0sIGRlc3Ryb3kgdGhlIG1vZGVsIGZyb20gKmxvY2FsU3RvcmFnZSogYW5kIGRlbGV0ZSBpdHMgdmlldy5cblx0XHRjbGVhcjogZnVuY3Rpb24gKCkge1xuXHRcdFx0dGhpcy5tb2RlbC5kZXN0cm95KCk7XG5cdFx0fVxuXHR9KTtcbn0pKGpRdWVyeSk7XG4iXX0=