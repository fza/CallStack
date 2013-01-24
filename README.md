CallStack
===========

Provides an easy way to ensure that method invocations always occur in the same order as methods have been called.

This is done by managing one or more stacks, which operate independently. Methods can be registered for one specific stack in order to be safe or the call may be announced manually. If a "synced" method is being called we look after the status of the corresponding stack. If the stack is free the method is invoked directly, otherwise the method invocation is queued up and occurs later after all other method calls are done.

Especially useful if you start some async events (Fx, Request, etc.) in one method and have to wait for a completion event which is caught by another method of your class. In the meantime it should be assured that no other synced method is executed to prevent unwanted manipulation of an instance' internal status by itself.

Note that you cannot rely on receiving return values of synced methods as they may not be run directly but queued up for later execution.

Stack-called methods will always run in the Class' instance context.

How to use
----------

To be written...
