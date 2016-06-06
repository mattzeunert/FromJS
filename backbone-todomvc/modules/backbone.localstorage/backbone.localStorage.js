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
