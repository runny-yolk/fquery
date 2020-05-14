function donHS(str){
    function isKid(x){
        return typeof x === 'string' || x instanceof Node || Array.isArray(x);
    }

    if(!str || typeof str !== 'string') throw new Error('Need at least one argument, must be string');
    var args = Array.from(arguments).slice(1);
    var attrs = !isKid(args[0]) && typeof args[0] !== 'object' ? args.shift() : {};
    var kids = args.flat(Infinity);
    
    // parsing string into tag name, id, and classes
    var tag = 'div', id, classes = [];
    str = str.match(/[#.]?[^#.]+/g);
    if(Array.isArray(str)) str.forEach(function(x){
        if(x[0] === '.') classes.push(x.slice(1));
        else if(x[0] === '#') id = x.slice(1);
        else tag = x;
    });

    classes = classes.join(' ');
    if(classes){
        if(typeof attrs.class === 'string') attrs.class += ' '+classes;
        else attrs.class = classes;
    }
    if(!attrs.id) attrs.id = id;

    var rtn = document.createElement(tag);

    for(let k in attrs){
        let x = attrs[k];
        if(typeof x === 'string') rtn.setAttribute(k, x);
        if(typeof x === 'function') rtn.addEventListener(k, x);
    }

    kids.forEach(x => {
        if(x instanceof Node) rtn.appendChild(x);
        else if(typeof x === 'string') rtn.appendChild( document.createTextNode(x) );
    });

    return rtn;
}

/*
// A function that makes it easy to create DOM elements, in the style of react-hyperscript
var h = domHS;

// creates a div
h('div');
// div is the default tag name, so if none is provided, makes a div
h('');
// throws
h();
// creates a div with id foo, classes bar and baz
h('#foo.bar.baz');
// creates a div with id foo, with some text inside it
h('#foo', 'some text inside');
// creates an img with id foo, with the src of the img /img/link
h('img#foo', {src:'/img/link'});
// further example
// logs when you click on it
// functions will get added as event listeners, via addEventListener
// attributes using setAttribute
h('#foo', {click:console.log},
    'Anything after the attributes, or after the string if attributes aren\'t provided, is considered children',
    h('.baz', 'Feel free to do as many as your browser can handle'),
    [
        'Children can also be in arrays',
        [
            h('p',
                'And the arrays all get flattened down into one.. ',
                [
                    'So no matter how many levels you nest, ',
                    [
                        'it makes no difference'
                    ]
                ]
            )
        ]
    ]
)
*/
