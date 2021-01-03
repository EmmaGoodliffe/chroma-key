
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const defaultHex = "#ffffff";
    const defaultAlpha = "ff";
    const defaultColour = defaultHex + defaultAlpha;
    const colour1 = writable(defaultColour);
    const colour2 = writable(defaultColour);

    /* src/ColourPicker.svelte generated by Svelte v3.31.0 */
    const file = "src/ColourPicker.svelte";

    function create_fragment(ctx) {
    	let div1;
    	let span;
    	let t0;
    	let t1;
    	let div0;
    	let t2;
    	let div0_style_value;
    	let t3;
    	let input0;
    	let t4;
    	let input1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			span = element("span");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			div0 = element("div");
    			t2 = text(/*fullColour*/ ctx[4]);
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			input1 = element("input");
    			attr_dev(span, "class", "title svelte-131k3ok");
    			add_location(span, file, 36, 2, 861);
    			attr_dev(div0, "class", "preview svelte-131k3ok");
    			attr_dev(div0, "style", div0_style_value = `color: ${/*fullColour*/ ctx[4]};`);
    			add_location(div0, file, 37, 2, 898);
    			attr_dev(input0, "type", "color");
    			attr_dev(input0, "class", "svelte-131k3ok");
    			add_location(input0, file, 38, 2, 972);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "svelte-131k3ok");
    			add_location(input1, file, 39, 2, 1053);
    			attr_dev(div1, "class", "colour-picker svelte-131k3ok");
    			add_location(div1, file, 35, 0, 831);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, span);
    			append_dev(span, t0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, t2);
    			append_dev(div1, t3);
    			append_dev(div1, input0);
    			set_input_value(input0, /*hex*/ ctx[2]);
    			append_dev(div1, t4);
    			append_dev(div1, input1);
    			set_input_value(input1, /*alpha*/ ctx[3]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[5]),
    					listen_dev(input0, "change", /*change_handler*/ ctx[6], false, false, false),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[7]),
    					listen_dev(input1, "change", /*change_handler_1*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);
    			if (dirty & /*fullColour*/ 16) set_data_dev(t2, /*fullColour*/ ctx[4]);

    			if (dirty & /*fullColour*/ 16 && div0_style_value !== (div0_style_value = `color: ${/*fullColour*/ ctx[4]};`)) {
    				attr_dev(div0, "style", div0_style_value);
    			}

    			if (dirty & /*hex*/ 4) {
    				set_input_value(input0, /*hex*/ ctx[2]);
    			}

    			if (dirty & /*alpha*/ 8 && input1.value !== /*alpha*/ ctx[3]) {
    				set_input_value(input1, /*alpha*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ColourPicker", slots, []);
    	let { title } = $$props;
    	let { onUpdate } = $$props;
    	let hex = defaultHex;
    	let alpha = defaultAlpha;
    	const writable_props = ["title", "onUpdate"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ColourPicker> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		hex = this.value;
    		$$invalidate(2, hex);
    	}

    	const change_handler = () => onUpdate(fullColour);

    	function input1_input_handler() {
    		alpha = this.value;
    		$$invalidate(3, alpha);
    	}

    	const change_handler_1 = () => onUpdate(fullColour);

    	$$self.$$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("onUpdate" in $$props) $$invalidate(1, onUpdate = $$props.onUpdate);
    	};

    	$$self.$capture_state = () => ({
    		defaultHex,
    		defaultAlpha,
    		title,
    		onUpdate,
    		hex,
    		alpha,
    		fullColour
    	});

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("onUpdate" in $$props) $$invalidate(1, onUpdate = $$props.onUpdate);
    		if ("hex" in $$props) $$invalidate(2, hex = $$props.hex);
    		if ("alpha" in $$props) $$invalidate(3, alpha = $$props.alpha);
    		if ("fullColour" in $$props) $$invalidate(4, fullColour = $$props.fullColour);
    	};

    	let fullColour;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*hex, alpha*/ 12) {
    			 $$invalidate(4, fullColour = hex + alpha);
    		}
    	};

    	return [
    		title,
    		onUpdate,
    		hex,
    		alpha,
    		fullColour,
    		input0_input_handler,
    		change_handler,
    		input1_input_handler,
    		change_handler_1
    	];
    }

    class ColourPicker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { title: 0, onUpdate: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ColourPicker",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[0] === undefined && !("title" in props)) {
    			console.warn("<ColourPicker> was created without expected prop 'title'");
    		}

    		if (/*onUpdate*/ ctx[1] === undefined && !("onUpdate" in props)) {
    			console.warn("<ColourPicker> was created without expected prop 'onUpdate'");
    		}
    	}

    	get title() {
    		throw new Error("<ColourPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<ColourPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onUpdate() {
    		throw new Error("<ColourPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onUpdate(value) {
    		throw new Error("<ColourPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.31.0 */

    const { console: console_1 } = globals;
    const file$1 = "src/App.svelte";

    // (97:4) {#if preview.length}
    function create_if_block(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*preview*/ ctx[1])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Preview");
    			attr_dev(img, "class", "svelte-3k8uhm");
    			add_location(img, file$1, 96, 24, 3294);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*preview*/ 2 && img.src !== (img_src_value = /*preview*/ ctx[1])) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(97:4) {#if preview.length}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;
    	let div0;
    	let t1;
    	let div1;
    	let input;
    	let t2;
    	let div2;
    	let t4;
    	let div3;
    	let colourpicker0;
    	let t5;
    	let colourpicker1;
    	let t6;
    	let div4;
    	let t8;
    	let div5;
    	let button;
    	let t10;
    	let div6;
    	let current;
    	let mounted;
    	let dispose;

    	colourpicker0 = new ColourPicker({
    			props: {
    				title: "Convert from...",
    				onUpdate: /*func*/ ctx[5]
    			},
    			$$inline: true
    		});

    	colourpicker1 = new ColourPicker({
    			props: {
    				title: "...to...",
    				onUpdate: /*func_1*/ ctx[6]
    			},
    			$$inline: true
    		});

    	let if_block = /*preview*/ ctx[1].length && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			div0.textContent = "Choose an image";
    			t1 = space();
    			div1 = element("div");
    			input = element("input");
    			t2 = space();
    			div2 = element("div");
    			div2.textContent = "Choose how to convert colours";
    			t4 = space();
    			div3 = element("div");
    			create_component(colourpicker0.$$.fragment);
    			t5 = space();
    			create_component(colourpicker1.$$.fragment);
    			t6 = space();
    			div4 = element("div");
    			div4.textContent = "Go!";
    			t8 = space();
    			div5 = element("div");
    			button = element("button");
    			button.textContent = "Chroma key";
    			t10 = space();
    			div6 = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "instructions svelte-3k8uhm");
    			add_location(div0, file$1, 82, 2, 2745);
    			attr_dev(input, "type", "file");
    			attr_dev(input, "id", "image-input");
    			attr_dev(input, "class", "svelte-3k8uhm");
    			add_location(input, file$1, 83, 7, 2800);
    			attr_dev(div1, "class", "svelte-3k8uhm");
    			add_location(div1, file$1, 83, 2, 2795);
    			attr_dev(div2, "class", "instructions svelte-3k8uhm");
    			add_location(div2, file$1, 84, 2, 2858);
    			attr_dev(div3, "class", "svelte-3k8uhm");
    			add_location(div3, file$1, 85, 2, 2922);
    			attr_dev(div4, "class", "instructions svelte-3k8uhm");
    			add_location(div4, file$1, 89, 2, 3084);
    			attr_dev(button, "class", "svelte-3k8uhm");
    			toggle_class(button, "disabled", /*buttonIsDisabled*/ ctx[2]);
    			add_location(button, file$1, 91, 4, 3132);
    			attr_dev(div5, "class", "svelte-3k8uhm");
    			add_location(div5, file$1, 90, 2, 3122);
    			attr_dev(div6, "class", "svelte-3k8uhm");
    			add_location(div6, file$1, 95, 2, 3264);
    			attr_dev(main, "class", "svelte-3k8uhm");
    			add_location(main, file$1, 81, 0, 2736);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(main, t1);
    			append_dev(main, div1);
    			append_dev(div1, input);
    			append_dev(main, t2);
    			append_dev(main, div2);
    			append_dev(main, t4);
    			append_dev(main, div3);
    			mount_component(colourpicker0, div3, null);
    			append_dev(div3, t5);
    			mount_component(colourpicker1, div3, null);
    			append_dev(main, t6);
    			append_dev(main, div4);
    			append_dev(main, t8);
    			append_dev(main, div5);
    			append_dev(div5, button);
    			append_dev(main, t10);
    			append_dev(main, div6);
    			if (if_block) if_block.m(div6, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_handler*/ ctx[4]),
    					listen_dev(
    						button,
    						"click",
    						function () {
    							if (is_function(/*buttonIsDisabled*/ ctx[2]
    							? null
    							: /*chromaKey*/ ctx[3])) (/*buttonIsDisabled*/ ctx[2]
    							? null
    							: /*chromaKey*/ ctx[3]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*buttonIsDisabled*/ 4) {
    				toggle_class(button, "disabled", /*buttonIsDisabled*/ ctx[2]);
    			}

    			if (/*preview*/ ctx[1].length) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div6, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(colourpicker0.$$.fragment, local);
    			transition_in(colourpicker1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(colourpicker0.$$.fragment, local);
    			transition_out(colourpicker1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(colourpicker0);
    			destroy_component(colourpicker1);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $colour1;
    	let $colour2;
    	validate_store(colour1, "colour1");
    	component_subscribe($$self, colour1, $$value => $$invalidate(7, $colour1 = $$value));
    	validate_store(colour2, "colour2");
    	component_subscribe($$self, colour2, $$value => $$invalidate(8, $colour2 = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	let files;
    	let preview = "";

    	const post = (url, data) => __awaiter(void 0, void 0, void 0, function* () {
    		const response = yield fetch(url, {
    			method: "POST",
    			headers: { "Content-Type": "application/json" },
    			body: JSON.stringify(data)
    		});

    		return response.json();
    	});

    	const bytesToBase64 = bytes => {
    		let binary = "";

    		for (let i = 0; i < bytes.byteLength; i++) {
    			binary += String.fromCharCode(bytes[i]);
    		}

    		return window.btoa(binary);
    	};

    	const chromaKey = () => __awaiter(void 0, void 0, void 0, function* () {
    		const [file] = files;
    		const arrayBuffer = yield file.arrayBuffer();
    		const bytes = new Uint8Array(arrayBuffer);
    		const base64 = bytesToBase64(bytes);

    		const result = yield post("/chroma-key", {
    			base64,
    			convert: { from: $colour1, to: $colour2 }
    		});

    		console.log({ result });
    		$$invalidate(1, preview = result.base64);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		files = this.files;
    		$$invalidate(0, files);
    	}

    	const func = c => colour1.set(c);
    	const func_1 = c => colour2.set(c);

    	$$self.$capture_state = () => ({
    		__awaiter,
    		ColourPicker,
    		colour1,
    		colour2,
    		files,
    		preview,
    		post,
    		bytesToBase64,
    		chromaKey,
    		buttonIsDisabled,
    		$colour1,
    		$colour2
    	});

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    		if ("files" in $$props) $$invalidate(0, files = $$props.files);
    		if ("preview" in $$props) $$invalidate(1, preview = $$props.preview);
    		if ("buttonIsDisabled" in $$props) $$invalidate(2, buttonIsDisabled = $$props.buttonIsDisabled);
    	};

    	let buttonIsDisabled;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*files*/ 1) {
    			 $$invalidate(2, buttonIsDisabled = !(files && files.length));
    		}
    	};

    	return [
    		files,
    		preview,
    		buttonIsDisabled,
    		chromaKey,
    		input_change_handler,
    		func,
    		func_1
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {},
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
