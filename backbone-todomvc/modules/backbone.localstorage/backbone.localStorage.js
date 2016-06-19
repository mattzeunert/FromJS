/**
 * Backbone localStorage Adapter
 * Version 1.1.16
 *
 * https://github.com/jeromegn/Backbone.localStorage
 */
(function (root, factory) {
  if (stringTraceTripleEqual(typeof exports === 'undefined' ? 'undefined' : stringTraceTypeOf(exports), stringTrace('object')) && stringTraceTripleEqual(typeof require === 'undefined' ? 'undefined' : stringTraceTypeOf(require), stringTrace('function'))) {
    module.exports = factory(require(stringTrace('backbone')));
  } else if (stringTraceTripleEqual(typeof define === 'undefined' ? 'undefined' : stringTraceTypeOf(define), stringTrace('function')) && define.amd) {
    // AMD. Register as an anonymous module.
    define([stringTrace('backbone')], function (Backbone) {
      // Use global variables if the locals are undefined.
      return factory(Backbone || root.Backbone);
    });
  } else {
    factory(Backbone);
  }
})(this, function (Backbone) {
  // A simple module to replace `Backbone.sync` with *localStorage*-based
  // persistence. Models are given GUIDS, and saved into a JSON object. Simple
  // as that.

  // Generate four random hex digits.
  function S4() {
    return (stringTraceAdd(1, Math.random()) * 0x10000 | 0).toString(16).substring(1);
  };

  // Generate a pseudo-GUID by concatenating random hexadecimal.
  function guid() {
    return stringTraceAdd(stringTraceAdd(stringTraceAdd(stringTraceAdd(stringTraceAdd(stringTraceAdd(stringTraceAdd(stringTraceAdd(stringTraceAdd(stringTraceAdd(stringTraceAdd(S4(), S4()), stringTrace('-')), S4()), stringTrace('-')), S4()), stringTrace('-')), S4()), stringTrace('-')), S4()), S4()), S4());
  };

  function isObject(item) {
    return stringTraceTripleEqual(item, Object(item));
  }

  function contains(array, item) {
    var i = array.length;

    while (stringTraceUseValue(i--)) if (stringTraceTripleEqual(array[i], item)) return true;

    return false;
  }

  function extend(obj, props) {
    for (var key in props) obj[key] = props[key];
    return obj;
  }

  function result(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return stringTraceUseValue(stringTraceTripleEqual(typeof value === 'undefined' ? 'undefined' : stringTraceTypeOf(value), stringTrace('function'))) ? object[property]() : value;
  }

  // Our Store is represented by a single JS object in *localStorage*. Create it
  // with a meaningful name, like the name you'd give a table.
  // window.Store is deprectated, use Backbone.LocalStorage instead
  Backbone.LocalStorage = window.Store = function (name, serializer) {
    if (!this.localStorage) {
      throw stringTrace('Backbone.localStorage: Environment does not support localStorage.');
    }
    this.name = name;
    this.serializer = serializer || {
      serialize: function (item) {
        return stringTraceUseValue(isObject(item)) ? JSON.stringify(item) : item;
      },
      // fix for "illegal access" error on Android when JSON.parse is passed null
      deserialize: function (data) {
        return data && JSON.parse(data);
      }
    };
    var store = this.localStorage().getItem(this.name);
    this.records = store && store.split(stringTrace(',')) || [];
  };

  extend(Backbone.LocalStorage.prototype, {

    // Save the current state of the **Store** to *localStorage*.
    save: function () {
      this.localStorage().setItem(this.name, this.records.join(stringTrace(',')));
    },

    // Add a model, giving it a (hopefully)-unique GUID, if it doesn't already
    // have an id of it's own.
    create: function (model) {
      if (!model.id && stringTraceNotTripleEqual(model.id, 0)) {
        model.id = guid();
        model.set(model.idAttribute, model.id);
      }
      this.localStorage().setItem(this._itemName(model.id), this.serializer.serialize(model));
      this.records.push(model.id.toString());
      this.save();
      return this.find(model);
    },

    // Update a model by replacing its copy in `this.data`.
    update: function (model) {
      this.localStorage().setItem(this._itemName(model.id), this.serializer.serialize(model));
      var modelId = model.id.toString();
      if (!contains(this.records, modelId)) {
        this.records.push(modelId);
        this.save();
      }
      return this.find(model);
    },

    // Retrieve a model from `this.data` by id.
    find: function (model) {
      return this.serializer.deserialize(this.localStorage().getItem(this._itemName(model.id)));
    },

    // Return the array of all models currently in storage.
    findAll: function () {
      var result = [];
      for (var i = 0, id, data; i < this.records.length; i++) {
        id = this.records[i];
        data = this.serializer.deserialize(this.localStorage().getItem(this._itemName(id)));
        if (data != null) result.push(data);
      }
      return result;
    },

    // Delete a model from `this.data`, returning it.
    destroy: function (model) {
      this.localStorage().removeItem(this._itemName(model.id));
      var modelId = model.id.toString();
      for (var i = 0, id; i < this.records.length; i++) {
        if (stringTraceTripleEqual(this.records[i], modelId)) {
          this.records.splice(i, 1);
        }
      }
      this.save();
      return model;
    },

    localStorage: function () {
      return localStorage;
    },

    // Clear localStorage for specific collection.
    _clear: function () {
      var local = this.localStorage(),
          itemRe = new RegExp(stringTraceAdd(stringTraceAdd(stringTrace('^'), this.name), stringTrace('-')));

      // Remove id-tracking item (e.g., "foo").
      local.removeItem(this.name);

      // Match all data items (e.g., "foo-ID") and remove.
      for (var k in local) {
        if (itemRe.test(k)) {
          local.removeItem(k);
        }
      }

      this.records.length = 0;
    },

    // Size of localStorage.
    _storageSize: function () {
      return this.localStorage().length;
    },

    _itemName: function (id) {
      return stringTraceAdd(stringTraceAdd(this.name, stringTrace('-')), id);
    }

  });

  // localSync delegate to the model or collection's
  // *localStorage* property, which should be an instance of `Store`.
  // window.Store.sync and Backbone.localSync is deprecated, use Backbone.LocalStorage.sync instead
  Backbone.LocalStorage.sync = window.Store.sync = Backbone.localSync = function (method, model, options) {
    var store = result(model, stringTrace('localStorage')) || result(model.collection, stringTrace('localStorage'));

    var resp, errorMessage;
    //If $ is having Deferred - use it.
    var syncDfd = stringTraceUseValue(Backbone.$) ? Backbone.$.Deferred && Backbone.$.Deferred() : Backbone.Deferred && Backbone.Deferred();

    try {
      switch (stringTraceUseValue(method)) {
        case "read":
          resp = stringTraceUseValue(model.id != undefined) ? store.find(model) : store.findAll();
          break;
        case "create":
          resp = store.create(model);
          break;
        case "update":
          resp = store.update(model);
          break;
        case "delete":
          resp = store.destroy(model);
          break;
      }
    } catch (error) {
      if (stringTraceTripleEqual(error.code, 22) && stringTraceTripleEqual(store._storageSize(), 0)) errorMessage = stringTrace('Private browsing is unsupported');else errorMessage = error.message;
    }

    if (resp) {
      if (options && options.success) {
        if (stringTraceTripleEqual(Backbone.VERSION, stringTrace('0.9.10'))) {
          options.success(model, resp, options);
        } else {
          options.success(resp);
        }
      }
      if (syncDfd) {
        syncDfd.resolve(resp);
      }
    } else {
      errorMessage = stringTraceUseValue(errorMessage) ? errorMessage : stringTrace('Record Not Found');

      if (options && options.error) if (stringTraceTripleEqual(Backbone.VERSION, stringTrace('0.9.10'))) {
        options.error(model, errorMessage, options);
      } else {
        options.error(errorMessage);
      }

      if (syncDfd) syncDfd.reject(errorMessage);
    }

    // add compatibility with $.ajax
    // always execute callback for success and error
    if (options && options.complete) options.complete(resp);

    return syncDfd && syncDfd.promise();
  };

  Backbone.ajaxSync = Backbone.sync;

  Backbone.getSyncMethod = function (model, options) {
    var forceAjaxSync = options && options.ajaxSync;

    if (!forceAjaxSync && (result(model, stringTrace('localStorage')) || result(model.collection, stringTrace('localStorage')))) {
      return Backbone.localSync;
    }

    return Backbone.ajaxSync;
  };

  // Override 'Backbone.sync' to default to localSync,
  // the original 'Backbone.sync' is still available in 'Backbone.ajaxSync'
  Backbone.sync = function (method, model, options) {
    return Backbone.getSyncMethod(model, options).apply(this, [method, model, options]);
  };

  return Backbone.LocalStorage;
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJhY2tib25lLmxvY2Fsc3RvcmFnZS1vcmlnaW5hbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFNQSxBQUFDLENBQUEsVUFBVSxJQUFJLEVBQUUsT0FBTyxFQUFFO0FBQ3hCLE1BQUksOEJBQU8sT0FBTyxtREFBUCxPQUFPLEdBQUsscUJBQVEsbUNBQVcsT0FBTyxtREFBUCxPQUFPLEdBQUssdUJBQVUsQ0FBQSxFQUFFO0FBQ2hFLFVBQU0sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyx1QkFBVSxDQUFDLENBQUMsQ0FBQztHQUMvQyxNQUFNLElBQUksOEJBQU8sTUFBTSxtREFBTixNQUFNLEdBQUssdUJBQVUsS0FBSSxNQUFNLENBQUMsR0FBRyxFQUFFOztBQUVyRCxVQUFNLENBQUMsQ0FBQyx1QkFBVSxDQUFDLEVBQUUsVUFBUyxRQUFRLEVBQUU7O0FBRXRDLGFBQU8sT0FBTyxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDM0MsQ0FBQyxDQUFDO0dBQ0osTUFBTTtBQUNMLFdBQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztHQUNuQjtDQUNGLENBQUEsQ0FBQyxJQUFJLEVBQUUsVUFBUyxRQUFRLEVBQUU7Ozs7OztBQU0zQixXQUFTLEVBQUUsR0FBRztBQUNYLFdBQU8sQ0FBQyxBQUFDLGVBQUMsQ0FBQyxFQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBRSxPQUFPLEdBQUUsQ0FBQyxDQUFBLENBQUUsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztHQUNuRTs7O0FBQUMsQUFHRixXQUFTLElBQUksR0FBRztBQUNiLGdMQUFRLEVBQUUsRUFBRSxFQUFDLEVBQUUsRUFBRSxHQUFDLGdCQUFHLEdBQUMsRUFBRSxFQUFFLEdBQUMsZ0JBQUcsR0FBQyxFQUFFLEVBQUUsR0FBQyxnQkFBRyxHQUFDLEVBQUUsRUFBRSxHQUFDLGdCQUFHLEdBQUMsRUFBRSxF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LFdBQU8sUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztHQUNyRixDQUFDOztBQUVGLFNBQU8sUUFBUSxDQUFDLFlBQVksQ0FBQztDQUM1QixDQUFDLENBQUUiLCJmaWxlIjoiYmFja2JvbmUubG9jYWxzdG9yYWdlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBCYWNrYm9uZSBsb2NhbFN0b3JhZ2UgQWRhcHRlclxuICogVmVyc2lvbiAxLjEuMTZcbiAqXG4gKiBodHRwczovL2dpdGh1Yi5jb20vamVyb21lZ24vQmFja2JvbmUubG9jYWxTdG9yYWdlXG4gKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuICBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiByZXF1aXJlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoXCJiYWNrYm9uZVwiKSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcbiAgICAvLyBBTUQuIFJlZ2lzdGVyIGFzIGFuIGFub255bW91cyBtb2R1bGUuXG4gICAgZGVmaW5lKFtcImJhY2tib25lXCJdLCBmdW5jdGlvbihCYWNrYm9uZSkge1xuICAgICAgLy8gVXNlIGdsb2JhbCB2YXJpYWJsZXMgaWYgdGhlIGxvY2FscyBhcmUgdW5kZWZpbmVkLlxuICAgICAgcmV0dXJuIGZhY3RvcnkoQmFja2JvbmUgfHwgcm9vdC5CYWNrYm9uZSk7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgZmFjdG9yeShCYWNrYm9uZSk7XG4gIH1cbn0odGhpcywgZnVuY3Rpb24oQmFja2JvbmUpIHtcbi8vIEEgc2ltcGxlIG1vZHVsZSB0byByZXBsYWNlIGBCYWNrYm9uZS5zeW5jYCB3aXRoICpsb2NhbFN0b3JhZ2UqLWJhc2VkXG4vLyBwZXJzaXN0ZW5jZS4gTW9kZWxzIGFyZSBnaXZlbiBHVUlEUywgYW5kIHNhdmVkIGludG8gYSBKU09OIG9iamVjdC4gU2ltcGxlXG4vLyBhcyB0aGF0LlxuXG4vLyBHZW5lcmF0ZSBmb3VyIHJhbmRvbSBoZXggZGlnaXRzLlxuZnVuY3Rpb24gUzQoKSB7XG4gICByZXR1cm4gKCgoMStNYXRoLnJhbmRvbSgpKSoweDEwMDAwKXwwKS50b1N0cmluZygxNikuc3Vic3RyaW5nKDEpO1xufTtcblxuLy8gR2VuZXJhdGUgYSBwc2V1ZG8tR1VJRCBieSBjb25jYXRlbmF0aW5nIHJhbmRvbSBoZXhhZGVjaW1hbC5cbmZ1bmN0aW9uIGd1aWQoKSB7XG4gICByZXR1cm4gKFM0KCkrUzQoKStcIi1cIitTNCgpK1wiLVwiK1M0KCkrXCItXCIrUzQoKStcIi1cIitTNCgpK1M0KCkrUzQoKSk7XG59O1xuXG5mdW5jdGlvbiBpc09iamVjdChpdGVtKSB7XG4gIHJldHVybiBpdGVtID09PSBPYmplY3QoaXRlbSk7XG59XG5cbmZ1bmN0aW9uIGNvbnRhaW5zKGFycmF5LCBpdGVtKSB7XG4gIHZhciBpID0gYXJyYXkubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSBpZiAoYXJyYXlbaV0gPT09IGl0ZW0pIHJldHVybiB0cnVlO1xuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGV4dGVuZChvYmosIHByb3BzKSB7XG4gIGZvciAodmFyIGtleSBpbiBwcm9wcykgb2JqW2tleV0gPSBwcm9wc1trZXldXG4gIHJldHVybiBvYmo7XG59XG5cbmZ1bmN0aW9uIHJlc3VsdChvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgaWYgKG9iamVjdCA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIHZhciB2YWx1ZSA9IG9iamVjdFtwcm9wZXJ0eV07XG4gICAgcmV0dXJuICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpID8gb2JqZWN0W3Byb3BlcnR5XSgpIDogdmFsdWU7XG59XG5cbi8vIE91ciBTdG9yZSBpcyByZXByZXNlbnRlZCBieSBhIHNpbmdsZSBKUyBvYmplY3QgaW4gKmxvY2FsU3RvcmFnZSouIENyZWF0ZSBpdFxuLy8gd2l0aCBhIG1lYW5pbmdmdWwgbmFtZSwgbGlrZSB0aGUgbmFtZSB5b3UnZCBnaXZlIGEgdGFibGUuXG4vLyB3aW5kb3cuU3RvcmUgaXMgZGVwcmVjdGF0ZWQsIHVzZSBCYWNrYm9uZS5Mb2NhbFN0b3JhZ2UgaW5zdGVhZFxuQmFja2JvbmUuTG9jYWxTdG9yYWdlID0gd2luZG93LlN0b3JlID0gZnVuY3Rpb24obmFtZSwgc2VyaWFsaXplcikge1xuICBpZiggIXRoaXMubG9jYWxTdG9yYWdlICkge1xuICAgIHRocm93IFwiQmFja2JvbmUubG9jYWxTdG9yYWdlOiBFbnZpcm9ubWVudCBkb2VzIG5vdCBzdXBwb3J0IGxvY2FsU3RvcmFnZS5cIlxuICB9XG4gIHRoaXMubmFtZSA9IG5hbWU7XG4gIHRoaXMuc2VyaWFsaXplciA9IHNlcmlhbGl6ZXIgfHwge1xuICAgIHNlcmlhbGl6ZTogZnVuY3Rpb24oaXRlbSkge1xuICAgICAgcmV0dXJuIGlzT2JqZWN0KGl0ZW0pID8gSlNPTi5zdHJpbmdpZnkoaXRlbSkgOiBpdGVtO1xuICAgIH0sXG4gICAgLy8gZml4IGZvciBcImlsbGVnYWwgYWNjZXNzXCIgZXJyb3Igb24gQW5kcm9pZCB3aGVuIEpTT04ucGFyc2UgaXMgcGFzc2VkIG51bGxcbiAgICBkZXNlcmlhbGl6ZTogZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgIHJldHVybiBkYXRhICYmIEpTT04ucGFyc2UoZGF0YSk7XG4gICAgfVxuICB9O1xuICB2YXIgc3RvcmUgPSB0aGlzLmxvY2FsU3RvcmFnZSgpLmdldEl0ZW0odGhpcy5uYW1lKTtcbiAgdGhpcy5yZWNvcmRzID0gKHN0b3JlICYmIHN0b3JlLnNwbGl0KFwiLFwiKSkgfHwgW107XG59O1xuXG5leHRlbmQoQmFja2JvbmUuTG9jYWxTdG9yYWdlLnByb3RvdHlwZSwge1xuXG4gIC8vIFNhdmUgdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlICoqU3RvcmUqKiB0byAqbG9jYWxTdG9yYWdlKi5cbiAgc2F2ZTogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5sb2NhbFN0b3JhZ2UoKS5zZXRJdGVtKHRoaXMubmFtZSwgdGhpcy5yZWNvcmRzLmpvaW4oXCIsXCIpKTtcbiAgfSxcblxuICAvLyBBZGQgYSBtb2RlbCwgZ2l2aW5nIGl0IGEgKGhvcGVmdWxseSktdW5pcXVlIEdVSUQsIGlmIGl0IGRvZXNuJ3QgYWxyZWFkeVxuICAvLyBoYXZlIGFuIGlkIG9mIGl0J3Mgb3duLlxuICBjcmVhdGU6IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgaWYgKCFtb2RlbC5pZCAmJiBtb2RlbC5pZCAhPT0gMCkge1xuICAgICAgbW9kZWwuaWQgPSBndWlkKCk7XG4gICAgICBtb2RlbC5zZXQobW9kZWwuaWRBdHRyaWJ1dGUsIG1vZGVsLmlkKTtcbiAgICB9XG4gICAgdGhpcy5sb2NhbFN0b3JhZ2UoKS5zZXRJdGVtKHRoaXMuX2l0ZW1OYW1lKG1vZGVsLmlkKSwgdGhpcy5zZXJpYWxpemVyLnNlcmlhbGl6ZShtb2RlbCkpO1xuICAgIHRoaXMucmVjb3Jkcy5wdXNoKG1vZGVsLmlkLnRvU3RyaW5nKCkpO1xuICAgIHRoaXMuc2F2ZSgpO1xuICAgIHJldHVybiB0aGlzLmZpbmQobW9kZWwpO1xuICB9LFxuXG4gIC8vIFVwZGF0ZSBhIG1vZGVsIGJ5IHJlcGxhY2luZyBpdHMgY29weSBpbiBgdGhpcy5kYXRhYC5cbiAgdXBkYXRlOiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHRoaXMubG9jYWxTdG9yYWdlKCkuc2V0SXRlbSh0aGlzLl9pdGVtTmFtZShtb2RlbC5pZCksIHRoaXMuc2VyaWFsaXplci5zZXJpYWxpemUobW9kZWwpKTtcbiAgICB2YXIgbW9kZWxJZCA9IG1vZGVsLmlkLnRvU3RyaW5nKCk7XG4gICAgaWYgKCFjb250YWlucyh0aGlzLnJlY29yZHMsIG1vZGVsSWQpKSB7XG4gICAgICB0aGlzLnJlY29yZHMucHVzaChtb2RlbElkKTtcbiAgICAgIHRoaXMuc2F2ZSgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5maW5kKG1vZGVsKTtcbiAgfSxcblxuICAvLyBSZXRyaWV2ZSBhIG1vZGVsIGZyb20gYHRoaXMuZGF0YWAgYnkgaWQuXG4gIGZpbmQ6IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgcmV0dXJuIHRoaXMuc2VyaWFsaXplci5kZXNlcmlhbGl6ZSh0aGlzLmxvY2FsU3RvcmFnZSgpLmdldEl0ZW0odGhpcy5faXRlbU5hbWUobW9kZWwuaWQpKSk7XG4gIH0sXG5cbiAgLy8gUmV0dXJuIHRoZSBhcnJheSBvZiBhbGwgbW9kZWxzIGN1cnJlbnRseSBpbiBzdG9yYWdlLlxuICBmaW5kQWxsOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgZm9yICh2YXIgaSA9IDAsIGlkLCBkYXRhOyBpIDwgdGhpcy5yZWNvcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZCA9IHRoaXMucmVjb3Jkc1tpXTtcbiAgICAgIGRhdGEgPSB0aGlzLnNlcmlhbGl6ZXIuZGVzZXJpYWxpemUodGhpcy5sb2NhbFN0b3JhZ2UoKS5nZXRJdGVtKHRoaXMuX2l0ZW1OYW1lKGlkKSkpO1xuICAgICAgaWYgKGRhdGEgIT0gbnVsbCkgcmVzdWx0LnB1c2goZGF0YSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH0sXG5cbiAgLy8gRGVsZXRlIGEgbW9kZWwgZnJvbSBgdGhpcy5kYXRhYCwgcmV0dXJuaW5nIGl0LlxuICBkZXN0cm95OiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHRoaXMubG9jYWxTdG9yYWdlKCkucmVtb3ZlSXRlbSh0aGlzLl9pdGVtTmFtZShtb2RlbC5pZCkpO1xuICAgIHZhciBtb2RlbElkID0gbW9kZWwuaWQudG9TdHJpbmcoKTtcbiAgICBmb3IgKHZhciBpID0gMCwgaWQ7IGkgPCB0aGlzLnJlY29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLnJlY29yZHNbaV0gPT09IG1vZGVsSWQpIHtcbiAgICAgICAgdGhpcy5yZWNvcmRzLnNwbGljZShpLCAxKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5zYXZlKCk7XG4gICAgcmV0dXJuIG1vZGVsO1xuICB9LFxuXG4gIGxvY2FsU3RvcmFnZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGxvY2FsU3RvcmFnZTtcbiAgfSxcblxuICAvLyBDbGVhciBsb2NhbFN0b3JhZ2UgZm9yIHNwZWNpZmljIGNvbGxlY3Rpb24uXG4gIF9jbGVhcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxvY2FsID0gdGhpcy5sb2NhbFN0b3JhZ2UoKSxcbiAgICAgIGl0ZW1SZSA9IG5ldyBSZWdFeHAoXCJeXCIgKyB0aGlzLm5hbWUgKyBcIi1cIik7XG5cbiAgICAvLyBSZW1vdmUgaWQtdHJhY2tpbmcgaXRlbSAoZS5nLiwgXCJmb29cIikuXG4gICAgbG9jYWwucmVtb3ZlSXRlbSh0aGlzLm5hbWUpO1xuXG4gICAgLy8gTWF0Y2ggYWxsIGRhdGEgaXRlbXMgKGUuZy4sIFwiZm9vLUlEXCIpIGFuZCByZW1vdmUuXG4gICAgZm9yICh2YXIgayBpbiBsb2NhbCkge1xuICAgICAgaWYgKGl0ZW1SZS50ZXN0KGspKSB7XG4gICAgICAgIGxvY2FsLnJlbW92ZUl0ZW0oayk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5yZWNvcmRzLmxlbmd0aCA9IDA7XG4gIH0sXG5cbiAgLy8gU2l6ZSBvZiBsb2NhbFN0b3JhZ2UuXG4gIF9zdG9yYWdlU2l6ZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMubG9jYWxTdG9yYWdlKCkubGVuZ3RoO1xuICB9LFxuXG4gIF9pdGVtTmFtZTogZnVuY3Rpb24oaWQpIHtcbiAgICByZXR1cm4gdGhpcy5uYW1lK1wiLVwiK2lkO1xuICB9XG5cbn0pO1xuXG4vLyBsb2NhbFN5bmMgZGVsZWdhdGUgdG8gdGhlIG1vZGVsIG9yIGNvbGxlY3Rpb24nc1xuLy8gKmxvY2FsU3RvcmFnZSogcHJvcGVydHksIHdoaWNoIHNob3VsZCBiZSBhbiBpbnN0YW5jZSBvZiBgU3RvcmVgLlxuLy8gd2luZG93LlN0b3JlLnN5bmMgYW5kIEJhY2tib25lLmxvY2FsU3luYyBpcyBkZXByZWNhdGVkLCB1c2UgQmFja2JvbmUuTG9jYWxTdG9yYWdlLnN5bmMgaW5zdGVhZFxuQmFja2JvbmUuTG9jYWxTdG9yYWdlLnN5bmMgPSB3aW5kb3cuU3RvcmUuc3luYyA9IEJhY2tib25lLmxvY2FsU3luYyA9IGZ1bmN0aW9uKG1ldGhvZCwgbW9kZWwsIG9wdGlvbnMpIHtcbiAgdmFyIHN0b3JlID0gcmVzdWx0KG1vZGVsLCAnbG9jYWxTdG9yYWdlJykgfHwgcmVzdWx0KG1vZGVsLmNvbGxlY3Rpb24sICdsb2NhbFN0b3JhZ2UnKTtcblxuICB2YXIgcmVzcCwgZXJyb3JNZXNzYWdlO1xuICAvL0lmICQgaXMgaGF2aW5nIERlZmVycmVkIC0gdXNlIGl0LlxuICB2YXIgc3luY0RmZCA9IEJhY2tib25lLiQgP1xuICAgIChCYWNrYm9uZS4kLkRlZmVycmVkICYmIEJhY2tib25lLiQuRGVmZXJyZWQoKSkgOlxuICAgIChCYWNrYm9uZS5EZWZlcnJlZCAmJiBCYWNrYm9uZS5EZWZlcnJlZCgpKTtcblxuICB0cnkge1xuXG4gICAgc3dpdGNoIChtZXRob2QpIHtcbiAgICAgIGNhc2UgXCJyZWFkXCI6XG4gICAgICAgIHJlc3AgPSBtb2RlbC5pZCAhPSB1bmRlZmluZWQgPyBzdG9yZS5maW5kKG1vZGVsKSA6IHN0b3JlLmZpbmRBbGwoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiY3JlYXRlXCI6XG4gICAgICAgIHJlc3AgPSBzdG9yZS5jcmVhdGUobW9kZWwpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJ1cGRhdGVcIjpcbiAgICAgICAgcmVzcCA9IHN0b3JlLnVwZGF0ZShtb2RlbCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImRlbGV0ZVwiOlxuICAgICAgICByZXNwID0gc3RvcmUuZGVzdHJveShtb2RlbCk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICB9IGNhdGNoKGVycm9yKSB7XG4gICAgaWYgKGVycm9yLmNvZGUgPT09IDIyICYmIHN0b3JlLl9zdG9yYWdlU2l6ZSgpID09PSAwKVxuICAgICAgZXJyb3JNZXNzYWdlID0gXCJQcml2YXRlIGJyb3dzaW5nIGlzIHVuc3VwcG9ydGVkXCI7XG4gICAgZWxzZVxuICAgICAgZXJyb3JNZXNzYWdlID0gZXJyb3IubWVzc2FnZTtcbiAgfVxuXG4gIGlmIChyZXNwKSB7XG4gICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5zdWNjZXNzKSB7XG4gICAgICBpZiAoQmFja2JvbmUuVkVSU0lPTiA9PT0gXCIwLjkuMTBcIikge1xuICAgICAgICBvcHRpb25zLnN1Y2Nlc3MobW9kZWwsIHJlc3AsIG9wdGlvbnMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3B0aW9ucy5zdWNjZXNzKHJlc3ApO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoc3luY0RmZCkge1xuICAgICAgc3luY0RmZC5yZXNvbHZlKHJlc3ApO1xuICAgIH1cblxuICB9IGVsc2Uge1xuICAgIGVycm9yTWVzc2FnZSA9IGVycm9yTWVzc2FnZSA/IGVycm9yTWVzc2FnZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFwiUmVjb3JkIE5vdCBGb3VuZFwiO1xuXG4gICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5lcnJvcilcbiAgICAgIGlmIChCYWNrYm9uZS5WRVJTSU9OID09PSBcIjAuOS4xMFwiKSB7XG4gICAgICAgIG9wdGlvbnMuZXJyb3IobW9kZWwsIGVycm9yTWVzc2FnZSwgb3B0aW9ucyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvcHRpb25zLmVycm9yKGVycm9yTWVzc2FnZSk7XG4gICAgICB9XG5cbiAgICBpZiAoc3luY0RmZClcbiAgICAgIHN5bmNEZmQucmVqZWN0KGVycm9yTWVzc2FnZSk7XG4gIH1cblxuICAvLyBhZGQgY29tcGF0aWJpbGl0eSB3aXRoICQuYWpheFxuICAvLyBhbHdheXMgZXhlY3V0ZSBjYWxsYmFjayBmb3Igc3VjY2VzcyBhbmQgZXJyb3JcbiAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5jb21wbGV0ZSkgb3B0aW9ucy5jb21wbGV0ZShyZXNwKTtcblxuICByZXR1cm4gc3luY0RmZCAmJiBzeW5jRGZkLnByb21pc2UoKTtcbn07XG5cbkJhY2tib25lLmFqYXhTeW5jID0gQmFja2JvbmUuc3luYztcblxuQmFja2JvbmUuZ2V0U3luY01ldGhvZCA9IGZ1bmN0aW9uKG1vZGVsLCBvcHRpb25zKSB7XG4gIHZhciBmb3JjZUFqYXhTeW5jID0gb3B0aW9ucyAmJiBvcHRpb25zLmFqYXhTeW5jO1xuXG4gIGlmKCFmb3JjZUFqYXhTeW5jICYmIChyZXN1bHQobW9kZWwsICdsb2NhbFN0b3JhZ2UnKSB8fCByZXN1bHQobW9kZWwuY29sbGVjdGlvbiwgJ2xvY2FsU3RvcmFnZScpKSkge1xuICAgIHJldHVybiBCYWNrYm9uZS5sb2NhbFN5bmM7XG4gIH1cblxuICByZXR1cm4gQmFja2JvbmUuYWpheFN5bmM7XG59O1xuXG4vLyBPdmVycmlkZSAnQmFja2JvbmUuc3luYycgdG8gZGVmYXVsdCB0byBsb2NhbFN5bmMsXG4vLyB0aGUgb3JpZ2luYWwgJ0JhY2tib25lLnN5bmMnIGlzIHN0aWxsIGF2YWlsYWJsZSBpbiAnQmFja2JvbmUuYWpheFN5bmMnXG5CYWNrYm9uZS5zeW5jID0gZnVuY3Rpb24obWV0aG9kLCBtb2RlbCwgb3B0aW9ucykge1xuICByZXR1cm4gQmFja2JvbmUuZ2V0U3luY01ldGhvZChtb2RlbCwgb3B0aW9ucykuYXBwbHkodGhpcywgW21ldGhvZCwgbW9kZWwsIG9wdGlvbnNdKTtcbn07XG5cbnJldHVybiBCYWNrYm9uZS5Mb2NhbFN0b3JhZ2U7XG59KSk7XG4iXX0=