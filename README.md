# fQuery
Fake-jQuery. A JS tool designed to replicate a good portion of the functionality of jQuery, with reduced impact on page load.

Useful if you need a thin utility for prototyping, or you're building A/B tests for the web, and need utilities, and don't want to add too much bulk. It's also highly extensible.

Disclaimer: While this tool is is very versatile and powerful, that comes at a cost, which is that it can be fragile if not used in the right way, and is *definitely* not type-safe. This is why it's reccomended for use for small or controlled use cases. Probably best not to use it for production code.

## How to use it
The fQuery function is put on the global variable `fQuery`. For a more jQuery-like experience, you could do `window.$ = fQuery`. This isn't done by default, because fQuery should be non-conflicting by default.

I always found two particular things the most useful from jQuery:
* The ability to select a bunch of DOM elements and apply a change to all of them, without having to write a bunch of iterator functions, or a bunch of for loops
* Being able to use the DOM APIs (The APIs that allow you to make changes to elements) without having to use them, since they can be very verbose

Obviously jQuery has a bunch of other useful features, and fQuery is not designed to replicate all of them - it's just designed to fulfil the items above in the best possible way, with as little code as possible.

fQuery achieves this in two core ways.

The first is by providing a wrapper function, `fQuery.doAction`, for all changes made to elements. When you call the fQuery function, an instance of `doAction` is returned, with `this` bound as the array of elements created as a result of the `fQuery` function.

This function is primarily designed to take a string as its first argument, called `action`. `action` typically refers to a property or method of the elements in the `this` array that you want to interact with. For example, if I wanted to use fQuery to add a class `foo` to every `div` on a page, I could do something like this:
```javascript
var $ = fQuery;
$('div')('classList.add', 'foo');
```

fQuery recognises that `classList.add` is a function, and so for each element in the `this` array, calls the function, passing in `foo` as an argument.

So the first thing we wanted, selecting and applying changes to DOM elements as groups, is done. The second thing, however, is not - we're still having to use the verbose DOM APIs. That's where aliases come in.

`fQuery.alias` is a plain object that contains aliases for common DOM APIs, which you can easily add to for your own purposes. The keys are the alias names and the values are the real names.

So instead of using `classList.add`, we can now do:
```javascript
$('div')('+class', 'foo');
```

Since I haven't documented them yet, for all the default aliases, I would reccomend checking the source code. There are also some advanced ways they can be used, which will be explained further on. Also note that because we're using strings instead of property names, there are few limitations on what characters can be used, so `$('div')('+class', 'foo')` works, where `$('div').+class` would not.

fQuery can also be used to get/set properties. For example:
```javascript
// val is another default alias, short for "value"
// sets all text inputs value as "foo"
$('input[type=text]')('val', 'foo');
// gets the value property of the first input
$('input[type=text]')('val');
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
* Can also be the `boolean` value `false`, in which case, `input` is parsed as HTML, and the created `Node`s are the content of the `this` array.
* Defaults to `window.document`
  
### fQuery.doAction(\[action\[, . . .acargs\]\])

This function is difficult to document comprehensively, in a way that makes sense, due to the fact that it can do a lot of different things, depending on the arguments provided to it, which is mostly dependent on type. The below is, I think, a good first attempt.

Feel free to read the source code if you want a fuller understanding - there isn't that much of it, after all.

After `action`, the remaining arguments are put into an array called `acargs`, and are used differently depending on what `action` is provided.

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

If the callback returns `false`, then that element will not be included the array that gets bound to the return instance of `doAction`
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
`action` is put into a variable called `acarr`
`action` becomes `acarr[0]`
`acargs` is then a concatenation of `acarr` and `acargs`

The easy way of thinking about it, is that this array works just like passing in a list of arguments, as you would normally, but because it's an array, can be modified programatically, or re-used.

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

Functions on `funcs` will be called by `fQuery.doAction` with `this` bound as the `this` array from `doAction`, and with `acargs` passed in as a list of arguments.

The return of the called `funcs` function will be the return of `doAction`
```javascript
// Can check whether a bound array contains a specific element
// this is one of the preconfigured ones, so no need to do this bit yourself if you like it
fQuery.funcs.has = function(val){
    return this.indexOf(val) > -1;
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

Another shortcut object is invoked, called `fQuery.propalias`. `alias` requires that the passed string fully matches one of the items, but `propalias` matches by segments of the property name. For example, `data: "dataset"` is one of the propaliases, meaning you can do `$('div')('data.foo')` instead of `$('div')('dataset.foo')`
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
$('input')('val', (val, i) => val+i);
```
The callback takes the following arguments: Current property value, Current Index, Object that has the property, Current item in the `this` array, ...acargs
* If the string refers to a property that is an object, and `acargs[0]` is an object, then the properties of the property are made to match `acargs[0]` (*I think*)
```javascript
// sets element.dataset.foo = "bar" for every item
$('div')('dataset', {foo:"bar"});
// CSS, you know this
$('div')('style', {border:"1px solid black"});
```
* Otherwise, the property is set to the value of `acargs[0]`

If the string refers to a function, then `acargs` is used as a list of arguments to call that function.

If the string refers to *a function that returns, or a property that is* an element, an array, or an array-like object (such as a `NodeList`), then for every element in the `this` array, a return array will be added to, with duplicates filtered out. `doAction` will then return with another instance of `doAction`, with the return array bound as `this`. This rule is what allows `querySelectorAll`, `children`, `parentElement`, etc, to work.

`doAction` will only return the result of a function call when the function is a property of the element directly, not when the function is a property of a property of the element. For example, `querySelectorAll` will work as described above, but `firstChild.querySelectorAll` will not.

If, after running the above, `doAction` has nothing else to return, it will just return another instance of itself, with the same `this` array bound.
