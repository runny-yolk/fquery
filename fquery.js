// TODO: Full refactor
void function(){
    var mergeObjs = function(){
        var rtn = {};
        for(var i = 0; i < arguments.length; i++) {
            var item = arguments[i];
            if(typeof item !== 'object') throw new TypeError('items must be objects');
            for(var k in item) rtn[k] = item[k];
        }
        return rtn;
    }
    var toArr = function(set){
        if(Array.isArray(set)) return set;
        else return Array.prototype.slice.call(set);
    }
    var has = function(set, val){
        set = toArr(set);
        return set.indexOf(val) > -1;
    }
    var getProto = Object.getPrototypeOf;
    var type = function(x){
        if(Array.isArray(x)) return 'array';
		if(x === null) return 'null';

        var xtype = typeof x;
        if(xtype === 'object') {
            if(!getProto(getProto(x))) return 'plainobj';
            if(typeof x.length === 'number' && x.length >= 0) return 'arraylike';
            if(x.nodeType === 1 && typeof x.nodeName === 'string') return 'element';
        }
        if(xtype === 'number' && isNaN(x)) return 'NaN';
        return xtype;
    }
    var tCheck = function(val, thing, types, opts){
        if(typeof thing !== 'string' || typeof types !== 'string') throw new TypeError('thing and types must be string');
        var defOpts = {
            optional: false,
            advanced: true,
            warn: true,
        }
        if(typeof opts !== 'object') opts = defOpts;
        else opts = mergeObjs(defOpts, opts);

        var valtype = opts.advanced? type(val) : typeof val;

        if(has(types.split(' '), valtype)) return valtype;
        else if(opts.optional && val !== undefined) {
            if(opts.warn) console.warn(thing+', if defined, should be: '+types);
            return false;
        }
        else throw new TypeError(thing+' must be: '+types);
    }
    var pushUnique = function(orig, set){
        orig = toArr(orig);
        set = toArr(set);
        for(var i = 0; i < set.length; i++) if(orig.indexOf(set[i]) < 0) orig.push(set[i]);
        return orig;
    }
    var getObj = function(props, set, cb){
        for(var s = 0 ; s < set.length; s++){
            var obj = set[s];
            for(var i = 0; i < props.length; i++) if(i < props.length-1) obj = obj[ props[i] ];
            if(cb(obj, s) === 'break') break;
        }
    }

    // Zhu Li, do the thing!
    var doAction = function(action){
        if(action === undefined) return this;
        var acargs = toArr(arguments).slice(1);

        var atype = type(action);
        if(atype === 'string') {
            var itr = fQuery.iterators[action];
            var fu = fQuery.funcs[action];
            var al = fQuery.alias[action];

            if(type(itr) === 'function') action = itr;
            else if(type(fu) === 'function') return fu.apply(fQuery.funcs, [this].concat(acargs));
            else if(al !== undefined) {
                if(type(al) === 'function') al = al.apply(0, acargs);

                if(tCheck(al, 'Alias', 'string array', {optional:true})) action = al;
            }
        }

        atype = type(action);

        if(atype === 'array'){
            if(type(action[0]) === 'array'){
                var rtn = this;
                while(action[0] && type(action[0]) === 'array'){
                    var thing = action.shift();
                    rtn = doAction.apply(rtn, thing);
                    if(type(rtn) === 'function') rtn = rtn();
                    else return rtn;
                }
                return fQuery(rtn);
            }
            else return doAction.apply(this, action.concat(acargs));
        }

        atype = tCheck(action, 'Action', 'number function string');

        if(atype === 'number'){
            var num = action;
            var end = acargs[0];
            if(end === null) return fQuery(this.slice(num));
            else if(type(end) !== 'number') {
                if(!has(['undefined', 'null'], type(this[num])) ) return fQuery([this[num]]);
                else return fQuery([]);
            }
            else return fQuery(this.slice(num, end));
        }
        else if(atype === 'function'){
            for(var p = 0; p < this.length; p++) action(this[p], p);
            return fQuery(this);
        }

        var props = action.split('.');
        for(var p = 0; p < props.length; p++) {
            var x = props[p];
            var a = fQuery.propalias[p];
            if(typeof a === 'object' && typeof a[x] === 'string') props[p] = a[x];
        }
        var actionName = props[props.length - 1];

        var rtnarr;
        for(var i = 0 ; i < this.length; i++){
            // Gets the object the action is being done on
            // eg for classList.add, the actioned object is the classList, not the element
            var obj = this[i];
            for(var p = 0; p < props.length - 1; p++) obj = obj[ props[p] ];
            
            // Handles the action being done, behaves differently based on type
            var ac = obj[actionName];
            var isfunc = false;

            if(typeof ac === 'function'){
                isfunc = true;
                ac = ac.apply(obj, acargs);

                // insertAdjacentElement returns the inserted element, hence this line
                if(actionName === 'insertAdjacentElement') continue;
            }
            else if(acargs[0] !== undefined){
                var arg = acargs[0];

                if(typeof arg === 'function') {
                    var frtn = arg.apply(0, [ac, i, obj, this[i]].concat(acargs.slice(1)));
                    if(frtn !== undefined) obj[actionName] = frtn;
                }
                else if(typeof arg === 'object' && typeof ac === 'object') {
                    var kys = Object.keys(arg);
                    for (var i = 0; i < kys.length; i++) {
                        var k = kys[i];
                        if(arg[k] === undefined) delete ac[k];
                        else ac[k] = arg[k];
                    }
                } 
                else obj[actionName] = arg;
                
                continue;
            }

            var rtntype = type(ac);
            if(has(['element', 'array', 'arraylike'], rtntype)) {
                // Will be done if you look at children, parentElement, etc
                // or use a function like querySelectorAll
                if(rtntype === 'element') ac = [ac];
              
                if(!rtnarr) rtnarr = [];
                pushUnique(rtnarr, ac);
            }
            else if(props.length > 1 && !isfunc) return ac;
            else if (ac !== undefined) return ac;
        }

        if(rtnarr) return fQuery(rtnarr);
        else return fQuery(this);
    }
    
    window.fQuery = function(input, context){
        context = context || document;
    
        var arr;
        var itype = tCheck(input, 'fQuery Input', 'array element string');

        if(itype === 'array') arr = input;
        else if (itype === 'element') arr = [input];
        else if (itype === 'string') {
            if(context === false) {
                // t for temporary
                var t = document.createElement('div');
                t.insertAdjacentHTML('afterbegin', input);
                arr = toArr(t.children);
            }
            else arr = toArr(context.querySelectorAll(input));
        }
    
        return doAction.bind(arr);
    }
    fQuery.utils = {
        toArr:toArr,
        has:has,
        type:type,
        pushUnique:pushUnique,
        tCheck:tCheck,
        mergeObjs:mergeObjs
    }
    fQuery.doAction = doAction;
    

    fQuery.iterators = {
        remove: function(el){
            if(el.parentNode) el.parentNode.removeChild(el);
        },
        run: function(el, i, ename, einit){
            tCheck(ename, 'Event Name', 'string');
            if(window.Event) {
                ename.split(' ').forEach(function(x){
                    el.dispatchEvent(new Event(x, einit));
                });
            }
            else console.error('IE does not support the Event constructor, but does support document.createEvent, figure it out (sorry)');
        },
        observe: function(el, i, opts, cb){
            new MutationObserver(cb).observe(el, opts);
        }
    }
    
    fQuery.funcs = {
        contains: function(arr, reg){
            return this.filter(arr, function(el){
				return Boolean( el.textContent.match(reg) );
			});
        },
        filter: function(arr, cb){
            // IE compat
            var match = Element.prototype.matches || Element.prototype.msMatchesSelector;
			var rtn = [];
			var sel;
			if(typeof cb === 'string') {
				sel = cb;
				cb = function(el){
					return match.call(el, sel);
				}
			}
            for(var i = 0; i < arr.length; i++) if(cb(arr[i], i)) rtn.push(arr[i]);
            return fQuery(rtn);
		},
		'!filter': function(arr, cb){
			var rtn = [];
			
            // IE compat
            var match = Element.prototype.matches || Element.prototype.msMatchesSelector;
			var sel;
			if(typeof cb === 'string') {
				sel = cb;
				cb = function(el){
					return match.call(el, sel);
				}
			}

            for(var i = 0; i < arr.length; i++) if(!cb(arr[i], i)) rtn.push(arr[i]);
            return fQuery(rtn);
		},
        '?': function(arr){
            return Boolean(arr[0]);
        },
        has: function(arr, val){
            return arr.indexOf(val) > -1;
        },
        index: function(arr){
            var el = arr[0];
            if(!el || !el.parentElement) return -1;
            return toArr(el.parentElement.children).indexOf(el);
        },
        parents: function(arr, sel, not){
            if(typeof sel !== 'string') sel = undefined;
            if(not !== true) not = false;
            // IE compat
            var match = Element.prototype.matches || Element.prototype.msMatchesSelector;

            var rtn = [];
            for (var i = 0; i < arr.length; i++) {
                var el = arr[i];
                var parent = el.parentElement;
                while(parent){
                    if(rtn.indexOf(parent) < 0) {
                        if(sel){
                            if(not) !match.call(parent, sel) && rtn.push(parent);
                            else match.call(parent, sel) && rtn.push(parent);
                        }
                        else rtn.push(parent);
                    }
                    parent = parent.parentElement;
                }
            }
            return fQuery(rtn);
        }
    }

    var getInsert = function(item, safety){
		if(safety !== true) safety = false;
        var itype = type(item),
            pos = this;

        if(itype === 'function') return getInsert.call(pos, item(), safety);

        if(itype === 'string') {
            // safety defaults to true, for XSS prevention
            if(safety) return ['insertAdjacentText', pos];
            else return ['insertAdjacentHTML', pos];
        }
        
        if(itype === 'element') return ['insertAdjacentElement', pos];

        if( has(['array', 'arraylike'], itype) ) return toArr(item).map(function(x){
            return getInsert.call(pos, x, safety).concat([x]);
        });

        // if no type is matched
        throw new TypeError('getInsert based aliases will take a string, element, array, or arraylike');
    }
    fQuery.alias = {
        on: function(evname, func, opts){
            return evname.split(' ').map(function(x){return ['addEventListener', x, func, opts] });
        },
        'exe+on': function(evname, func){
            func();
            return this.on.apply(this, arguments);
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
        kids: 'children',
        '+-class': 'classList.toggle',
        '+class': 'classList.add',
        '-class': 'classList.remove',
        '?class': 'classList.contains',
        before: getInsert.bind('beforebegin'),
        prepend: getInsert.bind('afterbegin'),
        append: getInsert.bind('beforeend'),
        after: getInsert.bind('afterend'),
        clone: function(deep){ if(deep !== false) deep = true; return ['cloneNode', deep]; }
	}
	
    fQuery.propalias = {
        0: {
            css: 'style',
            data: 'dataset',
            parent: 'parentElement',
        },
        1: {
            children: 'kids'
        }
    }
}();
