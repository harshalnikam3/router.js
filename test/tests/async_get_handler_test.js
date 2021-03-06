import Router from 'router';
import { Promise } from "rsvp";

// Intentionally use QUnit.module instead of module from test_helpers
// so that we avoid using Backburner to handle the async portions of
// the test suite
QUnit.module('Async Get Handler', {
  setup: function() {
    QUnit.config.testTimeout = 60000;

    this.handlers = {};
    this.router = new Router();
    this.router.map(function(match) {
      match("/index").to("index");
      match("/foo").to("foo", function(match) {
        match("/").to("fooIndex");
        match("/bar").to("fooBar");
      });
    });

    var testEnvironment = this;
    this.router.getHandler = function(name) {
      return new Promise(function(resolve) {
        setTimeout(function() {
          var handlers = testEnvironment.handlers;
          resolve(handlers[name] || (handlers[name] = {}));
        }, 1);
      });
    };
    this.router.updateURL = function() {};
  },

  teardown: function() {
    QUnit.config.testTimeout = 1000;
  }
});

QUnit.asyncTest('can transition to lazily-resolved routes', function(assert) {
  var fooCalled = false;
  var fooBarCalled = false;

  this.handlers.foo = {
    model: function() { fooCalled = true; }
  };
  this.handlers.fooBar = {
    model: function() { fooBarCalled = true; }
  };

  this.router.transitionTo('/foo/bar').then(function() {
    assert.ok(fooCalled, 'foo is called before transition ends');
    assert.ok(fooBarCalled, 'fooBar is called before transition ends');
    QUnit.start();
  });

  assert.ok(!fooCalled, 'foo is not called synchronously');
  assert.ok(!fooBarCalled, 'fooBar is not called synchronously');
});
