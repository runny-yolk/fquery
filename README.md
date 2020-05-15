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

The above is just a few of the things you can do with fQuery. All the other features are detailed below.

### fQuery(input\[, context\])

#### Example
```javascript
// find all divs on the page
fQuery('div');
// find all paragraph elements inside a div
fQuery('p', divThatContainsPs);
// query a document from the first iframe currently in the DOM
fQuery('div', window[0].document);
// parses input as HTML
fQuery('<div>Hello, world!</div>', false);
```

Returns an instance of the `fQuery.doAction` function, with an array of elements bound as `this`.

**`input`**
* Can be a string, array, or element.
* If `input` is a string, and `context` is set to anything other than `false`, it is passed into a call to `context.querySelectorAll`, the return of that call is used as the `this` array.
* If `input` is an array, then `input` is used as the `this` array.
* If `input` is an element, then it is wrapped in an array, and used as the `this` array.

**`context`**
* Can be any object that implements the querySelectorAll API, is intended to be a `Document` or an `Element`.
* Can also be the `boolean` value `false`, to indicate that context is irrelevant, in which case, `input` is parsed as HTML, and the created `Node`s are the content of the `this` array.
* Defaults to `window.document`
  
### fQuery.doAction(\[action\[, . . .acargs\]\])
What this function returns is highly dependent on the arguments passed

**`action`**
* Can be any of the types listed below

**`acargs`**
* Every argument that comes after `action` will be put into an array called `acargs`, which is used differently depending on what is provided for `action`

It can be difficult to fully grasp (and frankly, document) this function due to all the different things it does - feel free to read the source code if you want a fuller understanding - there isn't that much of it, after all.

#### When `action` is `undefined`
Returns `this`
```javascript
// divs contains an array of every div on the page
var divs = fQuery('div')();
```
#### When `action` is `number`
`acargs[0]` (i.e. the second argument passed to doAction) is expected to be `null`, `number`, or `undefined`

Returns an instance of the `fQuery.doAction` function, with an array of elements bound as `this`.

The `this` array is cut down using the `Array.prototype.slice` function, depending on the arguments provided.
```javascript
// returns a doAction instance where the "this" array contains all divs on the page
var $divs = fQuery('div');
// returns a doAction instance where the "this" array only contains the 3rd element in the array
// array will be empty if the 3rd element is undefined or null
$divs(2);
// "Array.prototype.slice" is called with no second argument
// therefore the array is sliced from the 3rd element to the end
// see MDN documentation of "Array.prototype.slice" for more info
// the fact that null is needed explicitly here isn't ideal, but is necessary to make sure the above functionality works
$divs(2, null);
// "Array.prototype.slice" is called with a second argument
// therefore the array is sliced from the 3rd element to the 6th element
// see MDN documentation of "Array.prototype.slice" for more info
$divs(2, 5);
```

#### When `action` is `function`
Returns an instance of the `fQuery.doAction` function, with an array of elements bound as `this`.

`action` is used as a callback function to iterate through each element in the list. The first two arguments provided to the callback are always the current element, and the index of that element in the `this` array.

The `acargs` array is then used to populate the rest of the arguments to the callback, i.e., arguments provided after the callback are then passed to the callback, just like how arguments passed after the 2nd argument of `setTimeout` are then passed to the callback.

If the callback returns `false` (and it has to be the `boolean false`, not just a falsy value like `0` or `null`), then that element will not be included the array that gets bound to the return instance of `doAction`, making the function act like an iterator and a filter. If you're intending on using the function just as an iterator, make sure it never returns `false`
```javascript
// returns a doAction instance where the "this" array contains all divs on the page
var $divs = fQuery('div');
// iterates through every element in the list and logs the id
$divs(function(el, i){
  console.log(el.id);
});

//does the same as the above, but now that prop is a variable, could be easily changed to something other than "id"
function logProp(el, i, prop){
  console.log(el[prop]);
}
$divs(logProp, "id");

// will filter element array to elements that have at least one child
function filterByChildNumber(el, i, childNumber){
  return el.children > childNumber;
}
$divs(filterByChildNumber, 1);
```

#### When `action` is `array`
doAction returns, with a new call to itself, with `action[0]` used as `action` in the new call, and the remaining elements of `action`+`acargs` becoming `acargs` for the new call.

So if you passed in `['insertAdjacentText', 'afterend'], 'foo'`, it would work as if you had passed in `'insertAdjacentText', 'afterend', 'foo'`

The purpose of this is that you can make an array, with pre-loaded arguments and functionality, for easy re-use.
```javascript
// returns a doAction instance where the "this" array contains all divs on the page
var $divs = fQuery('div');
// the following is actually implemented for you as an alias (explained further down), this is just an example
var insertTextAfter = ['insertAdjacentText', 'afterend'];
// inserts "foo" after every element in the array
$divs(insertTextAfter, 'foo');
// inserts "bar" after every element in the array
$divs(insertTextAfter, 'bar');
```

#### When `action` is `array` of `array`s
`action` is essentially used as a queue of multiple actions, each getting run one after the other. This way, you can programmatically queue up functionality, or just pre-load functionality for repeat use.

The elements in each `array` in `action` are passed as arguments to doAction. Everything else works as normal.
```javascript
// returns a doAction instance where the "this" array contains all divs on the page
var $divs = fQuery('div');
var actions = [
  ['insertAdjacentText', 'afterend', 'foo'],
  ['insertAdjacentText', 'afterend', 'bar'],
  ['insertAdjacentText', 'afterend', 'baz']
]
// conditionally remove the first action from the queue
if(condition) actions.shift();
$divs(actions);
```

#### When `action` is `string` - shortcut objects
fQuery contains 3 shortcut objects:
* `fQuery.iterators`
* `fQuery.funcs`
* `fQuery.alias`

When a string is passed in, the first thing that is done is these 3 objects are checked to see if the string you have passed in matches any of the keys in any of these objects. The first object to contain a matching key is the one that gets used, if any. This means that if `iterators` and `alias` both had a key of the same name, then the one in `iterators` would always get picked.

##### `iterators`
Works exactly like "When `action` is `function`", but you refer to the function by its name on the `iterators` object, using a string, instead of passing it in.
```javascript
// here is a useful iterator that can be used to filter out elements that match a specific selector
function not(el, i, sel){
    // IE compat
    var match = Element.prototype.matches || Element.prototype.msMatchesSelector;
    return !match.call(el, sel);
},

// normal usage, as shown in "When `action` is `function`"
fQuery('div')(not, '.foo');

// if we want the "not" function to be available everywhere, we can just:
fQuery.iterators.not = not;
// then use it by doing the following, which does the exact same as above
fQuery('div')('not', '.foo');
// this is actually one of the preconfigured ones, so you won't have to do this yourself if you like the function
```

##### `funcs`
These ones act very differently to the other two objects. The other two are just to make normal use of fQuery more convenient, but this one enables new functionality.

Functions on `funcs` will be called **once** by `fQuery.doAction`, with the `this` array passed in as the first argument, and `acargs` passed in as a list of arguments after that.

So, unlike with the functions in `iterators` where the function is called once for every element, the functions in `funcs` are only called once when 

The return of the called `funcs` function will be the return of `doAction`, making it useful for when you want to add some kind of bespoke functionality, that doesn't already exist in the DOM or fQuery.
```javascript
// Can check whether a bound array contains a specific element
// this is one of the preconfigured ones, so no need to do this bit yourself if you like it
fQuery.funcs.has = function(arr, val){
    return arr.indexOf(val) > -1;
}
// checks whether the bound array contains document.body
// returns false
fQuery('div')('has', document.body);
```

##### `alias`
The values on `alias` can be strings, arrays, or a function that returns either of those things.

Much like with `iterators`, everything else works just like you passed in the string or array as `action`

If a value on `alias` is a function, then `acargs` is passed into it as a list of arguments, so that the function can identify what should be used as an alias
```javascript
// Some of the aliases provided by default
fQuery.alias = {
    on: function(evname, func, opts){
        return evname.split(' ').map(function(x){return ['addEventListener', x, func, opts] });
    },
    att: function(atname, atval){
        if(atval !== undefined) return 'setAttribute';
        else return 'getAttribute';
    },
    pos: 'getBoundingClientRect',
    find: 'querySelectorAll',
    html: 'innerHTML',
    text: 'textContent',
    width: 'offsetWidth',
    height: 'offsetHeight',
    val: 'value',
    '+-class': 'classList.toggle',
    '+class': 'classList.add',
    '-class': 'classList.remove',
    '?class': 'classList.contains',
    clone: function(deep){ if(deep !== false) deep = true; return ['cloneNode', deep]; }
}
```

#### When `action` is `string` - element properties and functions
If none of the above shortcut objects are matched, then the string will be used to get properties of the elements in the `this` array. Below are the rules that govern that process:

Another shortcut object is invoked, called `fQuery.propalias`. `alias` requires that the passed string fully matches one of the items, but `propalias` matches by segments of the property name. For example, `data: "dataset"` is one of the propaliases, meaning you can do `fQuery('div')('data.foo')` instead of `fQuery('div')('dataset.foo')`
```javascript
// default propalias object at time of writing
// 0 denotes the first portion of the property string, each portion is delimited by a .
fQuery.propalias = {
    0: {
        css: 'style',
        data: 'dataset',
        parent: 'parentElement',
    }
}
```

If the string refers to a property that is not a function and is not undefined, `doAction` will return the value of the property.

If the string refers to a property that is not a function, and `acargs[0]` is defined, then several things can happen:
* If `acargs[0]` is a function, then it is used as a setter for the property for every element - the property is set to the return value of the function. Example:
```javascript
// Adds the index of the input to the value of every input
fQuery('input')('val', (val, i) => val+i);
```
The callback takes the following arguments: Current property value, Current Index, Object that has the property, Current item in the `this` array, ...acargs
* If the string refers to a property that is an object, and `acargs[0]` is an object, then the properties of the property are made to match `acargs[0]`, to allow you to modify things like the `dataset` or `style` properties easily
```javascript
// sets element.dataset.foo = "bar" for every item
fQuery('div')('dataset', {foo:"bar"});
// CSS, you know this
fQuery('div')('style', {border:"1px solid black"});
```
* Otherwise, the property is set to the value of `acargs[0]`

If the string refers to a function, then `acargs` is used as a list of arguments to call that function.

If the string refers to *a function that returns, or a property that is* an element, an array, or an array-like object (such as a `NodeList`), then for every element in the `this` array, a return array will be added to, built from the values/return values of the property, with duplicates filtered out. `doAction` will then return with another instance of `doAction`, with the return array bound as `this`. This rule is what allows `querySelectorAll`, `children`, `parentElement`, etc, to work.

`doAction` will only return the result of a function call when the function is a property of the element directly, not when the function is a property of a property of the element. For example, `querySelectorAll` will work as described above, but `firstChild.querySelectorAll` will not.

If, after running the above, `doAction` has nothing else to return, it will just return another instance of itself, with the same `this` array bound.
