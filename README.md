# fQuery
Fake-jQuery. A JS tool designed to replicate a good portion of the functionality of jQuery, with reduced impact on page load.

Useful if you need a thin utility for prototyping, or you're building A/B tests for the web, and need utilities, and don't want to add too much bulk. It's also highly extensible.

## How to use it
The fQuery function is put on the global variable `fQuery`. For a more jQuery-like experience, you could do `window.$ = fQuery;`. This isn't done by default so that fQuery can be non-conflicting by default.

### fQuery(input\[, context\])

#### Example
```javascript
// fetch all divs on the page
fQuery('div');
// fetch all paragraph elements inside a div
fQuery('p', divThatContainsPs);');
// query a document from the first iframe currently in the DOM
fQuery('div', window[0].document);
```

Returns an instance of the `fQuery.doAction` function, with an array of elements bound as `this`.

  **`input`**
  * Can be a string, array, or element.
  * If `input` is a string, and starts with a `<`, it is parsed as HTML, and the created `Node`s are the content of the `this` array.
  * If `input` is a string, it is passed into a call to `context.querySelectorAll`, the return of that call is used as the `this` array.
  * If `input` is an array, then `input` is used as the `this` array.
  * If `input` is an element, then it is wrapped in an array, and used as the `this` array.

  **`context`**
  * Can be any object that implements the querySelectorAll API, is intended to be a `Document` or an `Element`.
  * Defaults to `window.document`
  
### fQuery.doAction(\[action\[, . . .acargs\]\])

This function is difficult to document comprehensively, due to the fact that it can do a lot of different things, depending on the arguments provided to it, which is mostly dependent on type. The below is, I think, a good first attempt.

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
