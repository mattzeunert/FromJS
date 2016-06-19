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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJhY2tib25lLmxvY2Fsc3RvcmFnZS1vcmlnaW5hbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFNQSxBQUFDLENBQUEsVUFBVSxJQUFJLEVBQUUsT0FBTyxFQUFFO0FBQ3hCLE1BQUksOEJBQU8sT0FBTyxtREFBUCxPQUFPLDJEQUF3QixPQUFPLG1EQUFQLE9BQU8sMkJBQWUsRUFBRTtBQUNoRSxVQUFNLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLHlCQUFZLENBQUMsQ0FBQztHQUMvQyxNQUFNLElBQUksOEJBQU8sTUFBTSxtREFBTixNQUFNLCtCQUFtQixNQUFNLENBQUMsR0FBRyxFQUFFOztBQUVyRCxVQUFNLENBQUMseUJBQVksRUFBRSxVQUFTLFFBQVEsRUFBRTs7QUFFdEMsYUFBTyxPQUFPLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUMzQyxDQUFDLENBQUM7R0FDSixNQUFNO0FBQ0wsV0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0dBQ25CO0NBQ0YsQ0FBQSxDQUFDLElBQUksRUFBRSxVQUFTLFFBQVEsRUFBRTs7Ozs7O0FBTTNCLFdBQVMsRUFBRSxHQUFHO0FBQ1gsV0FBTyxDQUFDLEFBQUMsZUFBQyxDQUFDLEVBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFFLE9BQU8sR0FBRSxDQUFDLENBQUEsQ0FBRSxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0dBQ25FOzs7QUFBQyxBQUdGLFdBQVMsSUFBSSxHQUFHO0FBQ2IsZ0xBQVEsRUFBRSxFQUFFLEVBQUMsRUFBRSxFQUFFLHNCQUFLLEVBQUUsRUFBRSxzQkFBSyxFQUFFLEVBQUUsc0JBQUssRUFBRSxFQUFFLHNCQUFLLEVBQUUsRUFBRSxHQUFDLEVBQUUsRUFBRSxHQUFDLEVBQUUsRUFBRSxFQUFFO0dBQ25FLENBQUM7O0FBRUYsV0FBUyxRQUFRLENBQUMsSUFBSSxFQUFFO0FBQ3RCLGtDQUFPLElBQUksRUFBSyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUM7R0FDOUI7O0FBRUQsV0FBUyxRQUFRLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRTtBQUM3QixRQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDOzsrQkFDZCxDQUFDLEVBQUUsR0FBRSwyQkFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUssSUFBSSxHQUFFLE9BQU8sSUFBSSxDQUFDOztBQUMvQyxXQUFPLEtBQUssQ0FBQztHQUNkOztBQUVELFdBQVMsTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUU7QUFDMUIsU0FBSyxJQUFJLEdBQUcsSUFBSSxLQUFLLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUM1QyxXQUFPLEdBQUcsQ0FBQztHQUNaOztBQUVELFdBQVMsTUFBTSxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUU7QUFDOUIsUUFBSSxNQUFNLElBQUksSUFBSSxFQUFFLE9BQU8sS0FBSyxDQUFDLENBQUM7QUFDbEMsUUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzdCLDZEQUFlLEtBQUssbURBQUwsS0FBSywrQkFBbUIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEdBQUcsS0FBSyxDQUFDO0dBQ3JFOzs7OztBQUFBLEFBS0QsVUFBUSxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUMsS0FBSyxHQUFHLFVBQVMsSUFBSSxFQUFFLFVBQVUsRUFBRTtBQUNoRSxRQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRztBQUN2Qiw2RkFBeUU7S0FDMUU7QUFDRCxRQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztBQUNqQixRQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsSUFBSTtBQUM5QixlQUFTLEVBQUUsVUFBUyxJQUFJLEVBQUU7QUFDeEIsbUNBQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDO09BQ3JEOztBQUVELGlCQUFXLEVBQUUsVUFBVSxJQUFJLEVBQUU7QUFDM0IsZUFBTyxJQUFJLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztPQUNqQztLQUNGLENBQUM7QUFDRixRQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNuRCxRQUFJLENBQUMsT0FBTyxHQUFHLEFBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQyxLQUFLLGtCQUFLLElBQUssRUFBRSxDQUFDO0dBQ2xELENBQUM7O0FBRUYsUUFBTSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFOzs7QUFHdEMsUUFBSSxFQUFFLFlBQVc7QUFDZixVQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLGtCQUFLLENBQUMsQ0FBQztLQUNoRTs7OztBQUlELFVBQU0sRUFBRSxVQUFTLEtBQUssRUFBRTtBQUN0QixVQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsOEJBQUksS0FBSyxDQUFDLEVBQUUsRUFBSyxDQUFDLENBQUEsRUFBRTtBQUMvQixhQUFLLENBQUMsRUFBRSxHQUFHLElBQUksRUFBRSxDQUFDO0FBQ2xCLGFBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7T0FDeEM7QUFDRCxVQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDeEYsVUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0FBQ3ZDLFVBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNaLGFBQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUN6Qjs7O0FBR0QsVUFBTSxFQUFFLFVBQVMsS0FBSyxFQUFFO0FBQ3RCLFVBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUN4RixVQUFJLE9BQU8sR0FBRyxLQUFLLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ2xDLFVBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsRUFBRTtBQUNwQyxZQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUMzQixZQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7T0FDYjtBQUNELGFBQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUN6Qjs7O0FBR0QsUUFBSSxFQUFFLFVBQVMsS0FBSyxFQUFFO0FBQ3BCLGFBQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDM0Y7OztBQUdELFdBQU8sRUFBRSxZQUFXO0FBQ2xCLFVBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztBQUNoQixXQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN0RCxVQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyQixZQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwRixZQUFJLElBQUksSUFBSSxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztPQUNyQztBQUNELGFBQU8sTUFBTSxDQUFDO0tBQ2Y7OztBQUdELFdBQU8sRUFBRSxVQUFTLEtBQUssRUFBRTtBQUN2QixVQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDekQsVUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUNsQyxXQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ2hELG1DQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUssT0FBTyxHQUFFO0FBQy9CLGNBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztTQUMzQjtPQUNGO0FBQ0QsVUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ1osYUFBTyxLQUFLLENBQUM7S0FDZDs7QUFFRCxnQkFBWSxFQUFFLFlBQVc7QUFDdkIsYUFBTyxZQUFZLENBQUM7S0FDckI7OztBQUdELFVBQU0sRUFBRSxZQUFXO0FBQ2pCLFVBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUU7VUFDN0IsTUFBTSxHQUFHLElBQUksTUFBTSxpREFBTyxJQUFJLENBQUMsSUFBSSxxQkFBTzs7O0FBQUMsQUFHN0MsV0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDOzs7QUFBQyxBQUc1QixXQUFLLElBQUksQ0FBQyxJQUFJLEtBQUssRUFBRTtBQUNuQixZQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFDbEIsZUFBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNyQjtPQUNGOztBQUVELFVBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztLQUN6Qjs7O0FBR0QsZ0JBQVksRUFBRSxZQUFXO0FBQ3ZCLGFBQU8sSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLE1BQU0sQ0FBQztLQUNuQzs7QUFFRCxhQUFTLEVBQUUsVUFBUyxFQUFFLEVBQUU7QUFDdEIsMkNBQU8sSUFBSSxDQUFDLElBQUkscUJBQUssRUFBRSxFQUFDO0tBQ3pCOztHQUVGLENBQUM7Ozs7O0FBQUMsQUFLSCxVQUFRLENBQUMsWUFBWSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxRQUFRLENBQUMsU0FBUyxHQUFHLFVBQVMsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUU7QUFDckcsUUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssOEJBQWlCLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLDhCQUFpQixDQUFDOztBQUV0RixRQUFJLElBQUksRUFBRSxZQUFZOztBQUFDLEFBRXZCLFFBQUksT0FBTyx1QkFBRyxRQUFRLENBQUMsQ0FBQyxJQUNyQixRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxHQUM1QyxRQUFRLENBQUMsUUFBUSxJQUFJLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQUFBQyxDQUFDOztBQUU3QyxRQUFJO2tDQUVNLE1BQU07QUFDWixhQUFLLE1BQU07QUFDVCxjQUFJLHVCQUFHLEtBQUssQ0FBQyxFQUFFLElBQUksU0FBUyxJQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ25FLGdCQUFNO0FBQUEsQUFDUixhQUFLLFFBQVE7QUFDWCxjQUFJLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUMzQixnQkFBTTtBQUFBLEFBQ1IsYUFBSyxRQUFRO0FBQ1gsY0FBSSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDM0IsZ0JBQU07QUFBQSxBQUNSLGFBQUssUUFBUTtBQUNYLGNBQUksR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzVCLGdCQUFNO0FBQUE7S0FHWCxDQUFDLE9BQU0sS0FBSyxFQUFFO0FBQ2IsVUFBSSx1QkFBQSxLQUFLLENBQUMsSUFBSSxFQUFLLEVBQUUsNEJBQUksS0FBSyxDQUFDLFlBQVksRUFBRSxFQUFLLENBQUMsQ0FBQSxFQUNqRCxZQUFZLGlEQUFvQyxDQUFDLEtBRWpELFlBQVksR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDO0tBQ2hDOztBQUVELFFBQUksSUFBSSxFQUFFO0FBQ1IsVUFBSSxPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sRUFBRTtBQUM5QixtQ0FBSSxRQUFRLENBQUMsT0FBTywwQkFBZTtBQUNqQyxpQkFBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQ3ZDLE1BQU07QUFDTCxpQkFBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUN2QjtPQUNGO0FBQ0QsVUFBSSxPQUFPLEVBQUU7QUFDWCxlQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO09BQ3ZCO0tBRUYsTUFBTTtBQUNMLGtCQUFZLHVCQUFHLFlBQVksSUFBRyxZQUFZLGtDQUNNLENBQUM7O0FBRWpELFVBQUksT0FBTyxJQUFJLE9BQU8sQ0FBQyxLQUFLLEVBQzFCLDJCQUFJLFFBQVEsQ0FBQyxPQUFPLDBCQUFlO0FBQ2pDLGVBQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxPQUFPLENBQUMsQ0FBQztPQUM3QyxNQUFNO0FBQ0wsZUFBTyxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztPQUM3Qjs7QUFFSCxVQUFJLE9BQU8sRUFDVCxPQUFPLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO0tBQ2hDOzs7O0FBQUEsQUFJRCxRQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBRXhELFdBQU8sT0FBTyxJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztHQUNyQyxDQUFDOztBQUVGLFVBQVEsQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQzs7QUFFbEMsVUFBUSxDQUFDLGFBQWEsR0FBRyxVQUFTLEtBQUssRUFBRSxPQUFPLEVBQUU7QUFDaEQsUUFBSSxhQUFhLEdBQUcsT0FBTyxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUM7O0FBRWhELFFBQUcsQ0FBQyxhQUFhLEtBQUssTUFBTSxDQUFDLEtBQUssOEJBQWlCLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLDhCQUFpQixDQUFBLEFBQUMsRUFBRTtBQUNoRyxhQUFPLFFBQVEsQ0FBQyxTQUFTLENBQUM7S0FDM0I7O0FBRUQsV0FBTyxRQUFRLENBQUMsUUFBUSxDQUFDO0dBQzFCOzs7O0FBQUMsQUFJRixVQUFRLENBQUMsSUFBSSxHQUFHLFVBQVMsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUU7QUFDL0MsV0FBTyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0dBQ3JGLENBQUM7O0FBRUYsU0FBTyxRQUFRLENBQUMsWUFBWSxDQUFDO0NBQzVCLENBQUMsQ0FBRSIsImZpbGUiOiJiYWNrYm9uZS5sb2NhbHN0b3JhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEJhY2tib25lIGxvY2FsU3RvcmFnZSBBZGFwdGVyXG4gKiBWZXJzaW9uIDEuMS4xNlxuICpcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9qZXJvbWVnbi9CYWNrYm9uZS5sb2NhbFN0b3JhZ2VcbiAqL1xuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG4gIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIHJlcXVpcmUgPT09ICdmdW5jdGlvbicpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZShcImJhY2tib25lXCIpKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuICAgIC8vIEFNRC4gUmVnaXN0ZXIgYXMgYW4gYW5vbnltb3VzIG1vZHVsZS5cbiAgICBkZWZpbmUoW1wiYmFja2JvbmVcIl0sIGZ1bmN0aW9uKEJhY2tib25lKSB7XG4gICAgICAvLyBVc2UgZ2xvYmFsIHZhcmlhYmxlcyBpZiB0aGUgbG9jYWxzIGFyZSB1bmRlZmluZWQuXG4gICAgICByZXR1cm4gZmFjdG9yeShCYWNrYm9uZSB8fCByb290LkJhY2tib25lKTtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBmYWN0b3J5KEJhY2tib25lKTtcbiAgfVxufSh0aGlzLCBmdW5jdGlvbihCYWNrYm9uZSkge1xuLy8gQSBzaW1wbGUgbW9kdWxlIHRvIHJlcGxhY2UgYEJhY2tib25lLnN5bmNgIHdpdGggKmxvY2FsU3RvcmFnZSotYmFzZWRcbi8vIHBlcnNpc3RlbmNlLiBNb2RlbHMgYXJlIGdpdmVuIEdVSURTLCBhbmQgc2F2ZWQgaW50byBhIEpTT04gb2JqZWN0LiBTaW1wbGVcbi8vIGFzIHRoYXQuXG5cbi8vIEdlbmVyYXRlIGZvdXIgcmFuZG9tIGhleCBkaWdpdHMuXG5mdW5jdGlvbiBTNCgpIHtcbiAgIHJldHVybiAoKCgxK01hdGgucmFuZG9tKCkpKjB4MTAwMDApfDApLnRvU3RyaW5nKDE2KS5zdWJzdHJpbmcoMSk7XG59O1xuXG4vLyBHZW5lcmF0ZSBhIHBzZXVkby1HVUlEIGJ5IGNvbmNhdGVuYXRpbmcgcmFuZG9tIGhleGFkZWNpbWFsLlxuZnVuY3Rpb24gZ3VpZCgpIHtcbiAgIHJldHVybiAoUzQoKStTNCgpK1wiLVwiK1M0KCkrXCItXCIrUzQoKStcIi1cIitTNCgpK1wiLVwiK1M0KCkrUzQoKStTNCgpKTtcbn07XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGl0ZW0pIHtcbiAgcmV0dXJuIGl0ZW0gPT09IE9iamVjdChpdGVtKTtcbn1cblxuZnVuY3Rpb24gY29udGFpbnMoYXJyYXksIGl0ZW0pIHtcbiAgdmFyIGkgPSBhcnJheS5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIGlmIChhcnJheVtpXSA9PT0gaXRlbSkgcmV0dXJuIHRydWU7XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gZXh0ZW5kKG9iaiwgcHJvcHMpIHtcbiAgZm9yICh2YXIga2V5IGluIHByb3BzKSBvYmpba2V5XSA9IHByb3BzW2tleV1cbiAgcmV0dXJuIG9iajtcbn1cblxuZnVuY3Rpb24gcmVzdWx0KG9iamVjdCwgcHJvcGVydHkpIHtcbiAgICBpZiAob2JqZWN0ID09IG51bGwpIHJldHVybiB2b2lkIDA7XG4gICAgdmFyIHZhbHVlID0gb2JqZWN0W3Byb3BlcnR5XTtcbiAgICByZXR1cm4gKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykgPyBvYmplY3RbcHJvcGVydHldKCkgOiB2YWx1ZTtcbn1cblxuLy8gT3VyIFN0b3JlIGlzIHJlcHJlc2VudGVkIGJ5IGEgc2luZ2xlIEpTIG9iamVjdCBpbiAqbG9jYWxTdG9yYWdlKi4gQ3JlYXRlIGl0XG4vLyB3aXRoIGEgbWVhbmluZ2Z1bCBuYW1lLCBsaWtlIHRoZSBuYW1lIHlvdSdkIGdpdmUgYSB0YWJsZS5cbi8vIHdpbmRvdy5TdG9yZSBpcyBkZXByZWN0YXRlZCwgdXNlIEJhY2tib25lLkxvY2FsU3RvcmFnZSBpbnN0ZWFkXG5CYWNrYm9uZS5Mb2NhbFN0b3JhZ2UgPSB3aW5kb3cuU3RvcmUgPSBmdW5jdGlvbihuYW1lLCBzZXJpYWxpemVyKSB7XG4gIGlmKCAhdGhpcy5sb2NhbFN0b3JhZ2UgKSB7XG4gICAgdGhyb3cgXCJCYWNrYm9uZS5sb2NhbFN0b3JhZ2U6IEVudmlyb25tZW50IGRvZXMgbm90IHN1cHBvcnQgbG9jYWxTdG9yYWdlLlwiXG4gIH1cbiAgdGhpcy5uYW1lID0gbmFtZTtcbiAgdGhpcy5zZXJpYWxpemVyID0gc2VyaWFsaXplciB8fCB7XG4gICAgc2VyaWFsaXplOiBmdW5jdGlvbihpdGVtKSB7XG4gICAgICByZXR1cm4gaXNPYmplY3QoaXRlbSkgPyBKU09OLnN0cmluZ2lmeShpdGVtKSA6IGl0ZW07XG4gICAgfSxcbiAgICAvLyBmaXggZm9yIFwiaWxsZWdhbCBhY2Nlc3NcIiBlcnJvciBvbiBBbmRyb2lkIHdoZW4gSlNPTi5wYXJzZSBpcyBwYXNzZWQgbnVsbFxuICAgIGRlc2VyaWFsaXplOiBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgcmV0dXJuIGRhdGEgJiYgSlNPTi5wYXJzZShkYXRhKTtcbiAgICB9XG4gIH07XG4gIHZhciBzdG9yZSA9IHRoaXMubG9jYWxTdG9yYWdlKCkuZ2V0SXRlbSh0aGlzLm5hbWUpO1xuICB0aGlzLnJlY29yZHMgPSAoc3RvcmUgJiYgc3RvcmUuc3BsaXQoXCIsXCIpKSB8fCBbXTtcbn07XG5cbmV4dGVuZChCYWNrYm9uZS5Mb2NhbFN0b3JhZ2UucHJvdG90eXBlLCB7XG5cbiAgLy8gU2F2ZSB0aGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgKipTdG9yZSoqIHRvICpsb2NhbFN0b3JhZ2UqLlxuICBzYXZlOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmxvY2FsU3RvcmFnZSgpLnNldEl0ZW0odGhpcy5uYW1lLCB0aGlzLnJlY29yZHMuam9pbihcIixcIikpO1xuICB9LFxuXG4gIC8vIEFkZCBhIG1vZGVsLCBnaXZpbmcgaXQgYSAoaG9wZWZ1bGx5KS11bmlxdWUgR1VJRCwgaWYgaXQgZG9lc24ndCBhbHJlYWR5XG4gIC8vIGhhdmUgYW4gaWQgb2YgaXQncyBvd24uXG4gIGNyZWF0ZTogZnVuY3Rpb24obW9kZWwpIHtcbiAgICBpZiAoIW1vZGVsLmlkICYmIG1vZGVsLmlkICE9PSAwKSB7XG4gICAgICBtb2RlbC5pZCA9IGd1aWQoKTtcbiAgICAgIG1vZGVsLnNldChtb2RlbC5pZEF0dHJpYnV0ZSwgbW9kZWwuaWQpO1xuICAgIH1cbiAgICB0aGlzLmxvY2FsU3RvcmFnZSgpLnNldEl0ZW0odGhpcy5faXRlbU5hbWUobW9kZWwuaWQpLCB0aGlzLnNlcmlhbGl6ZXIuc2VyaWFsaXplKG1vZGVsKSk7XG4gICAgdGhpcy5yZWNvcmRzLnB1c2gobW9kZWwuaWQudG9TdHJpbmcoKSk7XG4gICAgdGhpcy5zYXZlKCk7XG4gICAgcmV0dXJuIHRoaXMuZmluZChtb2RlbCk7XG4gIH0sXG5cbiAgLy8gVXBkYXRlIGEgbW9kZWwgYnkgcmVwbGFjaW5nIGl0cyBjb3B5IGluIGB0aGlzLmRhdGFgLlxuICB1cGRhdGU6IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgdGhpcy5sb2NhbFN0b3JhZ2UoKS5zZXRJdGVtKHRoaXMuX2l0ZW1OYW1lKG1vZGVsLmlkKSwgdGhpcy5zZXJpYWxpemVyLnNlcmlhbGl6ZShtb2RlbCkpO1xuICAgIHZhciBtb2RlbElkID0gbW9kZWwuaWQudG9TdHJpbmcoKTtcbiAgICBpZiAoIWNvbnRhaW5zKHRoaXMucmVjb3JkcywgbW9kZWxJZCkpIHtcbiAgICAgIHRoaXMucmVjb3Jkcy5wdXNoKG1vZGVsSWQpO1xuICAgICAgdGhpcy5zYXZlKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmZpbmQobW9kZWwpO1xuICB9LFxuXG4gIC8vIFJldHJpZXZlIGEgbW9kZWwgZnJvbSBgdGhpcy5kYXRhYCBieSBpZC5cbiAgZmluZDogZnVuY3Rpb24obW9kZWwpIHtcbiAgICByZXR1cm4gdGhpcy5zZXJpYWxpemVyLmRlc2VyaWFsaXplKHRoaXMubG9jYWxTdG9yYWdlKCkuZ2V0SXRlbSh0aGlzLl9pdGVtTmFtZShtb2RlbC5pZCkpKTtcbiAgfSxcblxuICAvLyBSZXR1cm4gdGhlIGFycmF5IG9mIGFsbCBtb2RlbHMgY3VycmVudGx5IGluIHN0b3JhZ2UuXG4gIGZpbmRBbGw6IGZ1bmN0aW9uKCkge1xuICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMCwgaWQsIGRhdGE7IGkgPCB0aGlzLnJlY29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlkID0gdGhpcy5yZWNvcmRzW2ldO1xuICAgICAgZGF0YSA9IHRoaXMuc2VyaWFsaXplci5kZXNlcmlhbGl6ZSh0aGlzLmxvY2FsU3RvcmFnZSgpLmdldEl0ZW0odGhpcy5faXRlbU5hbWUoaWQpKSk7XG4gICAgICBpZiAoZGF0YSAhPSBudWxsKSByZXN1bHQucHVzaChkYXRhKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSxcblxuICAvLyBEZWxldGUgYSBtb2RlbCBmcm9tIGB0aGlzLmRhdGFgLCByZXR1cm5pbmcgaXQuXG4gIGRlc3Ryb3k6IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgdGhpcy5sb2NhbFN0b3JhZ2UoKS5yZW1vdmVJdGVtKHRoaXMuX2l0ZW1OYW1lKG1vZGVsLmlkKSk7XG4gICAgdmFyIG1vZGVsSWQgPSBtb2RlbC5pZC50b1N0cmluZygpO1xuICAgIGZvciAodmFyIGkgPSAwLCBpZDsgaSA8IHRoaXMucmVjb3Jkcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRoaXMucmVjb3Jkc1tpXSA9PT0gbW9kZWxJZCkge1xuICAgICAgICB0aGlzLnJlY29yZHMuc3BsaWNlKGksIDEpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnNhdmUoKTtcbiAgICByZXR1cm4gbW9kZWw7XG4gIH0sXG5cbiAgbG9jYWxTdG9yYWdlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbG9jYWxTdG9yYWdlO1xuICB9LFxuXG4gIC8vIENsZWFyIGxvY2FsU3RvcmFnZSBmb3Igc3BlY2lmaWMgY29sbGVjdGlvbi5cbiAgX2NsZWFyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgbG9jYWwgPSB0aGlzLmxvY2FsU3RvcmFnZSgpLFxuICAgICAgaXRlbVJlID0gbmV3IFJlZ0V4cChcIl5cIiArIHRoaXMubmFtZSArIFwiLVwiKTtcblxuICAgIC8vIFJlbW92ZSBpZC10cmFja2luZyBpdGVtIChlLmcuLCBcImZvb1wiKS5cbiAgICBsb2NhbC5yZW1vdmVJdGVtKHRoaXMubmFtZSk7XG5cbiAgICAvLyBNYXRjaCBhbGwgZGF0YSBpdGVtcyAoZS5nLiwgXCJmb28tSURcIikgYW5kIHJlbW92ZS5cbiAgICBmb3IgKHZhciBrIGluIGxvY2FsKSB7XG4gICAgICBpZiAoaXRlbVJlLnRlc3QoaykpIHtcbiAgICAgICAgbG9jYWwucmVtb3ZlSXRlbShrKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnJlY29yZHMubGVuZ3RoID0gMDtcbiAgfSxcblxuICAvLyBTaXplIG9mIGxvY2FsU3RvcmFnZS5cbiAgX3N0b3JhZ2VTaXplOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5sb2NhbFN0b3JhZ2UoKS5sZW5ndGg7XG4gIH0sXG5cbiAgX2l0ZW1OYW1lOiBmdW5jdGlvbihpZCkge1xuICAgIHJldHVybiB0aGlzLm5hbWUrXCItXCIraWQ7XG4gIH1cblxufSk7XG5cbi8vIGxvY2FsU3luYyBkZWxlZ2F0ZSB0byB0aGUgbW9kZWwgb3IgY29sbGVjdGlvbidzXG4vLyAqbG9jYWxTdG9yYWdlKiBwcm9wZXJ0eSwgd2hpY2ggc2hvdWxkIGJlIGFuIGluc3RhbmNlIG9mIGBTdG9yZWAuXG4vLyB3aW5kb3cuU3RvcmUuc3luYyBhbmQgQmFja2JvbmUubG9jYWxTeW5jIGlzIGRlcHJlY2F0ZWQsIHVzZSBCYWNrYm9uZS5Mb2NhbFN0b3JhZ2Uuc3luYyBpbnN0ZWFkXG5CYWNrYm9uZS5Mb2NhbFN0b3JhZ2Uuc3luYyA9IHdpbmRvdy5TdG9yZS5zeW5jID0gQmFja2JvbmUubG9jYWxTeW5jID0gZnVuY3Rpb24obWV0aG9kLCBtb2RlbCwgb3B0aW9ucykge1xuICB2YXIgc3RvcmUgPSByZXN1bHQobW9kZWwsICdsb2NhbFN0b3JhZ2UnKSB8fCByZXN1bHQobW9kZWwuY29sbGVjdGlvbiwgJ2xvY2FsU3RvcmFnZScpO1xuXG4gIHZhciByZXNwLCBlcnJvck1lc3NhZ2U7XG4gIC8vSWYgJCBpcyBoYXZpbmcgRGVmZXJyZWQgLSB1c2UgaXQuXG4gIHZhciBzeW5jRGZkID0gQmFja2JvbmUuJCA/XG4gICAgKEJhY2tib25lLiQuRGVmZXJyZWQgJiYgQmFja2JvbmUuJC5EZWZlcnJlZCgpKSA6XG4gICAgKEJhY2tib25lLkRlZmVycmVkICYmIEJhY2tib25lLkRlZmVycmVkKCkpO1xuXG4gIHRyeSB7XG5cbiAgICBzd2l0Y2ggKG1ldGhvZCkge1xuICAgICAgY2FzZSBcInJlYWRcIjpcbiAgICAgICAgcmVzcCA9IG1vZGVsLmlkICE9IHVuZGVmaW5lZCA/IHN0b3JlLmZpbmQobW9kZWwpIDogc3RvcmUuZmluZEFsbCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJjcmVhdGVcIjpcbiAgICAgICAgcmVzcCA9IHN0b3JlLmNyZWF0ZShtb2RlbCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcInVwZGF0ZVwiOlxuICAgICAgICByZXNwID0gc3RvcmUudXBkYXRlKG1vZGVsKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiZGVsZXRlXCI6XG4gICAgICAgIHJlc3AgPSBzdG9yZS5kZXN0cm95KG1vZGVsKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gIH0gY2F0Y2goZXJyb3IpIHtcbiAgICBpZiAoZXJyb3IuY29kZSA9PT0gMjIgJiYgc3RvcmUuX3N0b3JhZ2VTaXplKCkgPT09IDApXG4gICAgICBlcnJvck1lc3NhZ2UgPSBcIlByaXZhdGUgYnJvd3NpbmcgaXMgdW5zdXBwb3J0ZWRcIjtcbiAgICBlbHNlXG4gICAgICBlcnJvck1lc3NhZ2UgPSBlcnJvci5tZXNzYWdlO1xuICB9XG5cbiAgaWYgKHJlc3ApIHtcbiAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnN1Y2Nlc3MpIHtcbiAgICAgIGlmIChCYWNrYm9uZS5WRVJTSU9OID09PSBcIjAuOS4xMFwiKSB7XG4gICAgICAgIG9wdGlvbnMuc3VjY2Vzcyhtb2RlbCwgcmVzcCwgb3B0aW9ucyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvcHRpb25zLnN1Y2Nlc3MocmVzcCk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChzeW5jRGZkKSB7XG4gICAgICBzeW5jRGZkLnJlc29sdmUocmVzcCk7XG4gICAgfVxuXG4gIH0gZWxzZSB7XG4gICAgZXJyb3JNZXNzYWdlID0gZXJyb3JNZXNzYWdlID8gZXJyb3JNZXNzYWdlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogXCJSZWNvcmQgTm90IEZvdW5kXCI7XG5cbiAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLmVycm9yKVxuICAgICAgaWYgKEJhY2tib25lLlZFUlNJT04gPT09IFwiMC45LjEwXCIpIHtcbiAgICAgICAgb3B0aW9ucy5lcnJvcihtb2RlbCwgZXJyb3JNZXNzYWdlLCBvcHRpb25zKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9wdGlvbnMuZXJyb3IoZXJyb3JNZXNzYWdlKTtcbiAgICAgIH1cblxuICAgIGlmIChzeW5jRGZkKVxuICAgICAgc3luY0RmZC5yZWplY3QoZXJyb3JNZXNzYWdlKTtcbiAgfVxuXG4gIC8vIGFkZCBjb21wYXRpYmlsaXR5IHdpdGggJC5hamF4XG4gIC8vIGFsd2F5cyBleGVjdXRlIGNhbGxiYWNrIGZvciBzdWNjZXNzIGFuZCBlcnJvclxuICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLmNvbXBsZXRlKSBvcHRpb25zLmNvbXBsZXRlKHJlc3ApO1xuXG4gIHJldHVybiBzeW5jRGZkICYmIHN5bmNEZmQucHJvbWlzZSgpO1xufTtcblxuQmFja2JvbmUuYWpheFN5bmMgPSBCYWNrYm9uZS5zeW5jO1xuXG5CYWNrYm9uZS5nZXRTeW5jTWV0aG9kID0gZnVuY3Rpb24obW9kZWwsIG9wdGlvbnMpIHtcbiAgdmFyIGZvcmNlQWpheFN5bmMgPSBvcHRpb25zICYmIG9wdGlvbnMuYWpheFN5bmM7XG5cbiAgaWYoIWZvcmNlQWpheFN5bmMgJiYgKHJlc3VsdChtb2RlbCwgJ2xvY2FsU3RvcmFnZScpIHx8IHJlc3VsdChtb2RlbC5jb2xsZWN0aW9uLCAnbG9jYWxTdG9yYWdlJykpKSB7XG4gICAgcmV0dXJuIEJhY2tib25lLmxvY2FsU3luYztcbiAgfVxuXG4gIHJldHVybiBCYWNrYm9uZS5hamF4U3luYztcbn07XG5cbi8vIE92ZXJyaWRlICdCYWNrYm9uZS5zeW5jJyB0byBkZWZhdWx0IHRvIGxvY2FsU3luYyxcbi8vIHRoZSBvcmlnaW5hbCAnQmFja2JvbmUuc3luYycgaXMgc3RpbGwgYXZhaWxhYmxlIGluICdCYWNrYm9uZS5hamF4U3luYydcbkJhY2tib25lLnN5bmMgPSBmdW5jdGlvbihtZXRob2QsIG1vZGVsLCBvcHRpb25zKSB7XG4gIHJldHVybiBCYWNrYm9uZS5nZXRTeW5jTWV0aG9kKG1vZGVsLCBvcHRpb25zKS5hcHBseSh0aGlzLCBbbWV0aG9kLCBtb2RlbCwgb3B0aW9uc10pO1xufTtcblxucmV0dXJuIEJhY2tib25lLkxvY2FsU3RvcmFnZTtcbn0pKTtcbiJdfQ==