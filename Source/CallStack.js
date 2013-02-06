/*
---

name: CallStack

description: keep method invocations in sequence in an async context

license: MIT-style

authors:
- fza

requires:
- [Core/Class, Core/Object, Core/Array]

provides: [CallStack]

...
*/

(function() {
    var defaultKey = '$default',
        checkKey = function(key) {
            if (!key || typeOf(key) !== 'string' || key.length === 0) {
                return defaultKey;
            }

            return key;
        },
        registerKey = function(key) {
            if (!this.$stack.hasOwnProperty(key)) {
                initKey.call(this, key);
            }
        },
        initKey = function(key) {
            this.$stack[key] = [];
            this.$stackLock[key] = false;
        },
        registerMethods = function(key, methods) {
            var that = this;

            key = checkKey(key);

            Array.from(methods).each(function(methodName) {
                var original = that[methodName],
                    wrapped;

                if (!original || typeOf(original) !== 'function') {
                    return;
                }

                if (original.$original) {
                    original = original.$original;
                }

                wrapped = (function() {
                    var args = arguments,
                        value;

                    if (checkStack.apply(that, [key, methodName, args])) {
                        value = original.call(that, args);
                        releaseStackLock.call(that, key);
                        return value;
                    }
                }).bind(that);

                wrapped.$original = original;
                that[methodName] = wrapped;
            }, that);
        },
        checkStack = function(key, methodName, args) {
            var that = this;

            key = checkKey(key);
            registerKey.call(that, key);

            if (that.$stackLock[key]) {
                that.$stack[key].push([methodName, args]);
                return false;
            }

            return that.$stackLock[key] = true;
        },
        releaseStackLock = function(key) {
            var that = this,
                methodCall;

            key = checkKey(key);
            registerKey.call(that, key);
            that.$stackLock[key] = false;
            if (that.$stack[key].length) {
                methodCall = that.$stack[key].shift();
                that[methodCall[0]].apply(that, methodCall[1]);
            }
        };

    this.CallStack = new Class({

        $stack: {},
        $stackLock: {},

        checkStack: function(key, methodName, args) {
            if (arguments.length < 3) {
                methodName = key;
                args = methodName;
                key = defaultKey;
            }

            return checkStack(key, methodName, args);
        },

        releaseStackLock: function(key) {
            releaseStackLock(key);
        },

        clearStack: function(key) {
            var that = this;

            if (!key) {
                Object.each(that.$stack, function(value, key) {
                    initKey.call(that, key);
                }, that);
            }
            else {
                initKey.call(that, checkKey(key));
            }
        },

        isStackLocked: function(key) {
            return !!this.$stackLock[checkKey(key)];
        },

        registerSyncMethods: function() {
            var that = this,
                args = Array.link(arguments, {
                    'map': Type.isObject,
                    'key': Type.isString,
                    'methods': Type.isArray
                });

            if (args.map) {
                 Object.each(args.map, function(methods, key) {
                    registerMethods.call(that, key, methods);
                }, that);
            }
            else if (args.methods) {
                registerMethods.call(that, args.key, args.methods);
            }
        },

        isMethodQueued: function(methodName, key) {
            var that = this,
                checkMethodCallCallback = function(methodCall) {
                    if (methodCall[0] === methodName) {
                        return true;
                    }
                };

            if (!key) {
                return that.$stack.some(function(item) {
                    return item.some(checkMethodCallCallback);
                });
            }

            key = checkKey(key);
            if (that.$stack[key]) {
                return that.$stack[key].some(checkMethodCallCallback);
            }

            return false;
        }
    });
})();
