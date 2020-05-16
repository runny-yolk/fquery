# fQuery
Fake-jQuery. A JS tool designed to replicate a good portion of the functionality of jQuery, with reduced impact on page load.

Useful if you need a thin utility for prototyping, or you're building A/B tests for the web, and need utilities, and don't want to add too much bulk. It's also highly extensible.

## How to use it
The fQuery function is put on the global variable `fQuery`. For a more jQuery-like experience, you could do `window.$ = fQuery`. This isn't done by default, to make fQuery non-conflicting by default.

To make good use of fQuery, you will need a good knowledge of what the DOM APIs are and how they work.

I always found two particular things the most useful from jQuery:
* The ability to select a bunch of DOM elements and apply a change to all of them, without having to write a bunch of iterator functions, or a bunch of for loops
* Being able to use the DOM APIs (The APIs that allow you to make changes to elements) without having to use them directly, since they can be very verbose

Obviously jQuery has a bunch of other useful features, and fQuery is not designed to replicate all of them - it's just designed to fulfil the items above in the best possible way, with as little code as possible.

fQuery achieves this in two core ways.

The first is by providing a wrapper function, `fQuery.doAction`, for all changes made to elements. When you call the fQuery function, an instance of `doAction` is returned, with `this` bound as the array of elements created as a result of the `fQuery` function.

This function is primarily designed to take a string as its first argument, called `action`. `action` typically refers to a property or method of the elements in the `this` array that you want to interact with. For example, if I wanted to use fQuery to add a class `foo` to every `div` on a page, I could do something like this:
```javascript
fQuery('div')('classList.add', 'foo');
```

fQuery recognises that `classList.add` is a function, and so for each element in the `this` array, calls the function, passing in `foo` as an argument.

So the first thing we wanted, selecting and applying changes to DOM elements as groups, is done. The second thing, however, is not - we're still having to use the verbose DOM APIs. That's where aliases come in.

`fQuery.alias` is a plain object that contains aliases for common DOM APIs, which you can easily add to for your own purposes. The keys are the alias names and the values are the real names.

One of the default aliases is for `classList.add`, the alias for which is `+class`. If you were going to create this yourself, you would just do `fQuery.alias['+class'] = 'classList.add'` 

So instead of using `classList.add`, we can now do:
```javascript
fQuery('div')('+class', 'foo');
```

Since I haven't documented them yet, for all the default aliases, I would reccomend checking the source code. There are also some advanced ways they can be used, which will be explained further on.

fQuery can also be used to get/set properties. For example:
```javascript
// val is another default alias, short for "value"
// sets all text inputs value as "foo"
fQuery('input[type=text]')('val', 'foo');
// gets the value property of the first input
fQuery('input[type=text]')('val');
```

Because you can pass in strings to reference properties, fQuery is adaptable to a wide range of use cases, with minimal impact on page load, because there's no need to manually define getters/setters.
