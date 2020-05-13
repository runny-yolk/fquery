function _(str, attrs, childs){
    if(!str || typeof str !== 'string') throw new Error('Need at least one argument, must be string');
    
    var tag = str.match(/^([^#.]+?)(\.|#|$)/);
    if(tag !== null) str = str.slice(tag.length);
    tag = tag? tag[1] : 'div';
    
    var sels = str.match(/[#.][^#.]+/g);

    if(Array.isArray(attrs) || typeof attrs === 'string' || attrs instanceof Node){
        childs = attrs;
        attrs = undefined;
    }

    attrs = attrs || {};

    if(sels) sels.forEach(function(x){
        if(x[0] === '#') attrs.id = x.slice(1);
        if(x[0] === '.') attrs['class'] ? 
            attrs['class'] += ' '+x.slice(1):
            attrs['class'] = x.slice(1);
    });
    
    var ele = document.createElement(tag);

    for(var key in attrs){
        var item = attrs[key];

        if(typeof item === 'function') ele.addEventListener(key, item);
        else ele.setAttribute(key, item);
    }

    if(typeof childs === 'string') ele.appendChild(document.createTextNode(childs));
    else if(childs instanceof Node) ele.appendChild(childs);
    else if(Array.isArray(childs)) childs.forEach(function(x){
        if(typeof x === 'string') ele.appendChild(document.createTextNode(x));
        else if(x instanceof Node) ele.appendChild(x);
    });

    return ele;
}
