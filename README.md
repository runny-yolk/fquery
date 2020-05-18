# fQuery
Fake-jQuery. A JS tool designed to replicate a good portion of the functionality of jQuery, with reduced impact on page load.

dom-hyperscript.js is also included in this repo. It's a small utility that makes it easier to create DOM elements, and much like fQuery, takes a lot of the pain out of interfacing with the DOM. It's too small to justify its own repo, it's very simple, and it pairs well with fQuery, so it's kept here. You don't need it to use fQuery, and you don't need fQuery to use it.

Useful if you need a thin utility for prototyping, or you're building A/B tests for the web, and need utilities, and don't want to add too much bulk. It's also highly extensible.

This guide is for basic usage. If you want a better understanding of how fQuery works, please refer to [detail.md](/detail.md)

## Tradeoffs vs jQuery

The main thing is that fQuery is much smaller, so it can be downloaded and parsed by the browser faster than jQuery. This is achieved in 3 ways:
* Instead of having a large set of bespoke functions, fQuery is designed with a single framework that everything runs through, to ensure little repetition. The cost is that functionality can sometimes be unexpected.
* Browsers are a lot more consistent with one another than they used to be, so accounting for things like IE8 inconsistencies (as jQuery does) is no longer necessary for most use cases.
* fQuery also omits the auxiliary functionality that jQuery has, such as `ajax` or `cookies`. This is mostly just to keep fQuery slim, and focused on DOM manipulation as the primary function. `ajax` is also no longer necessary for modern projects, since the awkward `XMLHttpRequest` API has been succeeded by the promise-based `fetch`.

You also don't have to learn fQuery, if you already know how to use the DOM APIs (which you should learn before learning jQuery anyway). The way fQuery works is by passing in a string to tell it what DOM APIs to apply to the selected elements, which is what allows it to be leaner. This, combined with aliases, solves the problem of verbose DOM APIs with little code.

This isn't to say fQuery is better - it depends on your use case - but I would say if your use case is DOM manipulation, then I think fQuery is a leaner solution to that problem. And fQuery can always be used with other tightly focused libraries to fulfil all your needs, while keeping shipped code down to a minimum.

## Basic usage

Let's imagine we have the following document:
```html
<div id="foo" class="containers">
    Test text
</div>
<div id="bar" class="containers">
    Text in a div
</div>
<div class="baz"></div>
<div class="baz"></div>
<form>
    <input type="text" name="username"/>
    <input type="password" name="password"/>
    <input type="submit" name="submit" value="Submit form"/>
</form>
```

The fQuery function is where we start. By default, it's put on the global variable `fQuery`. For a more jQuery-like experience, you could do `window.$ = fQuery` after fQuery is loaded. This isn't done by default, to make fQuery non-conflicting by default.

For the sake of clarity in this tutorial, $ will not be used by fQuery, since we'll be doing some comparisons with jQuery (which will also be invoked without the use of $). Don't let that stop you from using $ for fQuery when you use it, though.

### Selecting elements

fQuery just uses `document.querySelectorAll` to select elements, so jQuery-specific pseudo-selectors won't work, to keep functionality consistent with CSS and `document.querySelectorAll`, and keep fQuery slim.

```javascript
// In this example, we'll just select every div element.
// DOM API
document.querySelectorAll('div');
// jQuery
jQuery('div');
// fQuery
fQuery('div');

// We can also select by id...
document.querySelectorAll('#foo');
jQuery('#foo');
fQuery('#foo');

// ..or by class.
document.querySelectorAll('.containers');
jQuery('.containers');
fQuery('.containers');

// Maybe you want to select the children of an element:
document.querySelectorAll('form > input');
jQuery('form > input');
fQuery('form > input');

// Or select using multiple selectors at once:
document.querySelectorAll('div, form > input');
jQuery('div, form > input');
fQuery('div, form > input');
```

As I said, fQuery selectors work the same as CSS selectors, which are already extensively documented elsewhere.

### Adding a class (running functions and making aliases)

Let's add a class to make the elements with the `containers` class hidden:
```javascript
// DOM API
// UGH, am I right?
// very recent browser versions have NodeList.prototype.forEach, which helps, but support is not yet widespread
var containers = document.querySelectorAll('.containers');
for(var i = 0; i < containers.length; i++) containers[i].classList.add('hidden');

// jQuery
jQuery('.containers').addClass('hidden');

// fQuery
fQuery('.containers')('classList.add', 'hidden');
// or..
// does the same thing
fQuery('.containers')('+class', 'hidden');
```

As you can see, fQuery can use the existing DOM APIs to make changes. It does this by dynamically searching for the properties specified by the string, on the selected elements. This means that anything you know how to do with the DOM APIs can be done to a batch of selected elements with fQuery.

The second thing you might notice is the use of `+class` in place of `classList.add`. In fQuery, this is called an `alias`. Aliases are defined in `fQuery.alias`, `+class` is one of the default ones. This allows us to avoid having to type the verbose DOM APIs every time, while also not needing to make a wrapper function to shorten the name.

To create the `+class` alias, all you'd need to do is `fQuery.alias['+class'] = 'classList.add'`, it's created for you by default however. I'm just telling you this so you know how to make your own aliases.

Aliases can also be defined as arrays, so you can, for example, alias a function and an argument (or arguments).
```javascript
fQuery.alias['hide'] = ['classList.add', 'hidden'];
fQuery.alias['show'] = ['classList.remove', 'hidden'];
// now you can do
fQuery('.containers')('hide');
fQuery('.containers')('show');
// which does the same as
fQuery('.containers')('classList.add', 'hidden');
fQuery('.containers')('classList.remove', 'hidden');
/*
Note that the hide/show aliases use classList.add/classList.remove, and not +class/-class. This is because you cannot have aliases of aliases. This is done to keep what each alias does explicit, instead of having obscure alias chains.
*/
```

The third thing to take note of is that jQuery returns an object, so requires you to use a `.` to chain. fQuery, however, returns a function (called `fQuery.doAction`), so to chain off it, you use parentheses `()` to call the function, and pass in arguments telling the function what you want to do to the selected elements. This way of doing things is what enables fQuery's versatility. See the bottom of this guide for general rules on how this works.

### Getters/Setters

#### Getters (Not chainable)
You can get or set any property of any element in your selection, just by using the property name. This also works for functions that act as getters.

```javascript
// DOM API
// Gets positional data for the first container
document.querySelectorAll('.containers')[0].getBoundingClientRect();
// Will get the text of the first container
document.querySelectorAll('.containers')[0].textContent;

// jQuery
// Gets positional data for the first container
jQuery('.containers').pos();
// Will get the combined text of both containers
jQuery('.containers').text();
// Will get the text of the first container
jQuery('.containers').eq(0).text();
// Gets the attribute "data-val" of the first element
jQuery('.containers').attr('data-val');

// fQuery
// Gets positional data for the first container
// pos is an alias for getBoundingClientRect
fQuery('.containers')('pos');
// text is an alias for textContent
// Will get the text of the first container
fQuery('.containers')('text');
// Gets the attribute "data-val" of the first element
fQuery('.containers')('getAttribute', 'data-val');
// or..
// att is an alias for both getAttribute and setAttribute - providing a third argument will switch it to setAttribute
fQuery('.containers')('att', 'data-val');
```

No matter what property you're getting, fQuery will always take the value from the first element and return it, for the sake of consistency and ease of implementation.

#### Getters (Chainable)

The exception to this is if the property is an element, an array, or an array-like object (an object with a property called `length` of type `number`)

```javascript
// jQuery
// changes the selection to the parent of each selected element, making sure the new selection doesn't contain any duplicates
jQuery('.containers').parent();
// adds class containers-parents to the parents
jQuery('.containers')('parent').addClass('containers-parents');
// changes the selection to the children of each selected element, while ensuring no duplicates
jQuery('form').children();

// fQuery
// changes the selection to the parent of each selected element, making sure the new selection doesn't contain any duplicates
// parent is an alias for parentElement
fQuery('.containers')('parent');
// adds class containers-parents to the parents
fQuery('.containers')('parent')('+class', 'containers-parents');
// changes the selection to the children of each selected element, while ensuring no duplicates
// kids is an alias for children
// children is an array-like object that contains a list of child elements
fQuery('form')('kids');
```

#### Setters (Chainable)

Just as you can use fQuery to get any element property, you can use it to set them as well. There are 3 ways of doing this.

```javascript
// sets the HTML of both containers to be "some new HTML"
fQuery('.containers')('html', 'some new HTML');
// sets the HTML of both containers to be "some new HTML0" and "some new HTML1"
// the function is called for every selected element - this will work, so long as the first argument (where 'html' is) doesn't refer to a function (like 'setAttribute', which is a function)
fQuery('.containers')('html', function(currentValue, i, element){
    return currentValue+i;
});
// instead of writing the above seperately, they could also be written like
fQuery('.containers')('html', 'some new HTML')('html', function(currentValue, i, element){
    return currentValue+i;
});

// sets the style of containers to have a red background
// css is an alias for style
// note that unlike jQuery, this will replace the existing style, not add to it
// this only works if both the value you are passing in, and the property you're referring to are both objects
fQuery('.containers')('css', {background:'red'});
```

### Iterating selections

To iterate a selection, you can just provide a function to `doAction`:
```javascript
// iterate and log all the divs
jQuery('div').each(function(i, el){
	// note the order of the index and object arguments is inconsistent with ECMAscript functions such as Array.prototype.forEach and Array.prototype.map
	console.log(el);
});

// iterate and log all the divs
fQuery('div')(function(el, i){
	console.log(el);
});
```

You might want to iterate a selection to apply the same change to a bunch of elements, but using functionality fQuery doesn't have in its basic framework. For example, creating a set of MutationObservers to observe DOM changes on the selected elements:
```javascript
// observes DOM changes inside all divs and log them
fQuery('div')(function(el, i){
	new MutationObserver( console.log ).observe(el, {childList:true});
});

function observe(el, i, opts, cb){
	new MutationObserver(cb).observe(el, opts);
}
// observes DOM changes inside all divs and log them
// this time, by passing in the options and callback as parameters
fQuery('div')(observe, {childList:true}, console.log);

fQuery.iterators.observe = function (el, i, opts, cb){
	new MutationObserver(cb).observe(el, opts);
}
// observes DOM changes inside all divs and log them
// this time, by passing in the options and callback as parameters
// and now that observe is on the iterators object, it can be called from anywhere, by using its name in a string
fQuery('div')('observe', {childList:true}, console.log);
```

### Refining selections, and extending fQuery's functionality

You can refine your selection by index just by passing in a number to `doAction`:
```javascript
// changes the selection from all divs to just the first div
jQuery('div').eq(0);
// changes the selection from all divs to just the third div
jQuery('div').eq(2);

// changes the selection from all divs to just the first div
fQuery('div')(0);
// changes the selection from all divs to just the third div
fQuery('div')(2);
```

Or by using a range of indexes, as with `Array.prototype.slice`:
```javascript
// changes the selection from all divs to 2nd div - last div
jQuery('div').slice(1);
// changes the selection from all divs to 1st div - 3rd div
jQuery('div').slice(0, 2);
// changes the selection from all divs to 2nd div - div 1 before last
jQuery('div').slice(1, -1);

// changes the selection from all divs to 2nd div - last div
fQuery('div')(1, null);
// changes the selection from all divs to 1st div - 3rd div
fQuery('div')(0, 2);
// changes the selection from all divs to 2nd div - div 1 before last
fQuery('div')(1, -1);
```

Note that if you want to use `slice` functionality without specifying a second argument, `null` has to be passed explicitly as the second argument. This is to differentiate it from the syntax used to select a single index.

You might want to filter elements based on an arbitrary conditions, instead of just by number. fQuery doesn't have a way of doing this as part of its basic framework, but it does have an object called `fQuery.funcs` that makes it easy to extend fQuery's default functionality. `funcs`, by default, is configured with a `filter` function.

```javascript
// filters the selection to only divs that have the containers class
jQuery('div').filter('.containers');
// filters the selection to only divs that have the attribute data-foo with value "true"
jQuery('div').filter(function(el, i){
	return el.dataset.foo = 'true';
});
// filters the selection to only divs that do not have the containers class
jQuery('div').not('.containers');

// filters the selection to only divs that have the containers class
fQuery('div')('filter', '.containers');
// filters the selection to only divs that have the attribute data-foo with value "true"
fQuery('div')('filter', function(el, i){
	return el.dataset.foo = 'true';
});
// filters the selection to only divs that do not have the containers class
// will also work with a callback
fQuery('div')('!filter', '.containers');
```

You might also want a function to check if a specific element is in your selection. Here's how you'd add that functionality to fQuery:
```javascript
// arr is the array of the currently selected elements
// val is passed in when the function is called
// functions in funcs are only called once when invoked
fQuery.funcs.has = function(arr, val){
	return arr.indexOf(val) > -1;
}

// returns false - the body element would not be in a selection of divs
fQuery('div')('has', document.body);
```

`has` is configured for you, so you don't have to add it yourself if you want to use it, I'm just using it here for example purposes.

### Chaining details

In *general* `doAction` will return another `doAction` (i.e. be chainable) when you. . :
* Are doing something that makes a change to the selected elements (like adding/removing classes, setting HTML/text/values etc)
* Are getting an element, or list of elements, (or invoking a function that returns either of these) from the selected elements, the elements you're getting become the selected elements (so, `fQuery('input')('parent')` changes the selection from the inputs to the parents of all the inputs, or `fQuery('form')('find', 'input')` changes the selection from the form elements to the inputs inside the form elements)
* Pass in a number or a function as an argument

In *general* `doAction` will **not** return another `doAction` (i.e. **not** be chainable) when you. . :
* Are getting a property of an element that is **not** another element or a list of some kind (like `value`, `innerHTML`, or `scrollTop`). In this case, `doAction` will get the property value from the first element and return it.
* Are calling a function of an element that does **not** return another element or a list of some kind (like `getBoundingClientRect`, `getAttribute`). In this case, `doAction` will get the return value from the first element and return it.
* Pass no arguments to `doAction` (i.e. `fQuery('.containers')()`) in which case, the array of selected elements is returned.

If you want more detail on the above, or are experiencing unexpected behaviour, please refer to the end of [detail.md](/detail.md) for more info on this topic
