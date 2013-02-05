CallStack
===========

Provides an easy way to ensure that method invocations always occur in the same order as methods have been called.

This is done by managing one or more stacks, which operate independently. Methods can be registered for one specific stack in order to be safe or the call may be announced manually. If a "synced" method is being called we look after the status of the corresponding stack. If the stack is free the method is invoked directly, otherwise the method invocation is queued up and occurs later after all previous method calls are done.

Especially useful if you start some async events (Fx, Request, etc.) in one method and have to wait for a completion event which is caught by another method of your class. In the meantime it should be assured that no other synced method is executed to prevent unwanted manipulation of an instance' internal status by itself.

Note that you cannot rely on receiving return values of synced methods as they may not be run directly but queued up for later execution.

Stack-called methods will always run in the class' instance context.

CallStack is used as a support class to be implemented in your own classes via `Implements: [CallStack]`.

How to use
----------

Code explains it better:

    var MyClass = new Class({

        Implements: [CallStack],

        initialize: function() {
            this.registerSyncMethods(['doSomethingSpecial']);
        }

        startFx: function() {
            if (!this.checkStack('startFx')) return;

            var el = $('div.test');

            new Fx.Tween(el)
                .addEvent('complete', this.fxComplete)
                .start('left', 50);
        },

        fxComplete: function() {
            /* ... */

            this.releaseStackLock();
        },

        doSomethingSpecial: function() {
            /* ... */
        }
    });

    var foo = new MyClass();

    foo.startFx();
    foo.doSomethingSpecial();

What happens here? First, MyClass implements CallStack so we have access to the CallStack functionality. Within the constructor we define the methods that should be automatically synchronized. In this example we only need to register `doSomethingSpecial()`, because it is the only method we want the stack to handle synchronisation automatically. When we fire up `startFx()` it first tests if the stack is locked. If it is, then it's execution is queued. Otherwise the lock is obtained. We then start some Fx and add an event handler for the `complete` event (just as an example). Now the Fx runs, which takes some time. The execution context switches from the `startFx()` function back to the main script's context. Here we try to invoke `doSomethingSpecial()`, which is synchronized automatically. Because the stack is locked due to the running Fx, the execution of `doSomethingSpecial()` is queued for later. After the Fx is done, `fxComplete()` releases the manual stack lock, which is a trigger to work off the queue and finally invokes `doSomethingSpecial()`.

This is a very simple example, but you get the idea. JavaScript is a single-threaded language and at runtime code execution is divided into "execution frames". If one frame is done, the next starts and so on, just like a queue. John Riesig explains this excellently [in his blog](http://ejohn.org/blog/how-javascript-timers-work/). If you must execute particular code parts in the right order and need to use asynchronous events, you may run into trouble. This is what CallStack is meant to be used for.

Note that in more sophisticated classes you may end up with more than one execution queue. This is what the key argument is used for:

- `this.registerSyncMethods(key, methods)`
- or: `this.registerSyncMethods({key1: methods, key2: methods})`
- or with manual synchronisation: `this.checkStack(key, methodName, arguments)`

Remember if you use manual synchronisation, you must release the queue lock on the right queue: `this.releaseStackLock(key)`

Provided methods
----------------

- `registerSyncMethods`
- `checkStack`
- `releaseStackLock`
- `isMethodQueued`
- `isStackLocked`
- `clearStack`

Have a look at the source to see the correct method signatures.
