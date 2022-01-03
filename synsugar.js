/**
   Copyright 2021 Carlos A. <https://github.com/dealfonso>

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */
(function(exports) {

    let defaults =  {
        icon_class: 'material-icons-outlined',
        icon_as_class: false,
        convert_icons: true
    }

    function configure(options) {
        for (let k in defaults) {
            if (options[k] !== undefined) {
                defaults[k] = options[k];
            }
        }
    }

    /** 
     * This is a simple microparser to parse jade (or pug)-like object definitions
     * and return objects with the following structure:
     * {    tag: "tag_name",
     *      id: "id_name",
     *      classes: [ "class_name", ... ],
     *      attrs: { attr_name: "attr_value", attr_name: "attr_value", ... } }
     * 
     * e.g.: 
     *      div#id.class1.class2(attr1="value1", attr2="value2")
     * 
     * The extra feature is that this parser also recognizes a syntax for including a chain of
     *   objects, using the ">" character.
     * This means that it is possible to define something like:
     *   object1 > object2 > object3 > ...
     * what would mean that object1 contains object2 and object2 contains object3. The result of
     *   the parsing would be an array of object where the first element is object1, the second
     *   element is object2 and the third element is object3, and so on
     */
    class MicroParser {

        _start(txt) {
            this._txt = txt;
            this._pos = 0;
            this._c = null;
            this._p = null;
        }

        // Function to get the next char and adjust the internal pointer
        _next() {
            if (this._pos < this._txt.length) {
                this._p = this._c;
                this._c = this._txt[this._pos];
                this._pos++;
                return true;
            }
            this._c = null;
            return false;
        }

        /**
         * Function that eats the blank characters
         */
        _eatblanks() {
            while ([ ' ', '\t', '\n', '\r' ].indexOf(this._c) >= 0) {
                this._next();
            }
        }

        /**
         * Obtains an identifier to act as the name of an attribute, class or id
         * @returns {String} the name of the attribute (null if error)
         */
        _getAttr() {
            let chars = /[a-zA-Z]/;
            let charsEx = /[a-zA-Z0-9_-]/;

            // Skip blanks
            this._eatblanks();

            if (!chars.test(this._c)) {
                return null;
            }
            let attr = this._c;
            while (this._next() && charsEx.test(this._c)) {
                attr += this._c;
            }

            // Skip blanks
            this._eatblanks();
            return attr;
        }

        /**
         * Reads a string inside double quotes (or any of character that may enclose the string; the first one found is used)
         * @returns {String} the string value of the string
         */
        _getString() {
            let str = "";
            let dchar = this._c;

            // Start skipping the beggining string character
            while (this._next()) {
                if ((this._c === dchar) && (this._p !== "\\")) { 
                    break;
                }
                str += this._c;
            }
            // If no quote has been closed the whole file will be eaten; so inform the user at this place
            if (this._c === null) {
                this._syntaxError("unclosed quote");
            }

            // Skip the ending string character
            this._next();
            return str;
        }

        /**
         * 
         * @returns {String} the value of the attribute (null if "null" keyword is found); blank if no value is found
         */
        _getValue() {
            let value = "";

            this._eatblanks();
            switch (this._c) {
                case '"':
                case "'":
                    value = this._getString();
                    break;

                default:
                    while ([ ',', ')', ' ', '\t' ].indexOf(this._c) < 0) {
                        value += this._c;
                        if (!this._next()) {
                            return value;
                        }
                    }
                    value = value.trim();
                    
                    // The special value
                    if (value === "null") {
                        value = null;
                    }
                    break;
            }
            this._eatblanks();
            return value;
        }

        _syntaxError(x) {
            console.error(`syntax error near ${this._pos} (${this._c}): ${x}`);
            return null;
        }

        /**
         * Function that parses the "jade-like" string and returns the object structure
         * @param {*} txt - the string to parse
         * @returns {*} the object structure
         */
        parse(txt) {
            this._start(txt);

            let results = [];
            while (true) {

                let attrs = {};
                this._next();

                // Get the tag name
                let tag = this._getAttr();
                if (tag === null) {
                    tag = "div";
                }

                // Get the ID
                let id = null;
                if (this._c === '#') {
                    this._next();
                    id = this._getAttr();
                    if (id === null) {
                        return this._syntaxError("invalid ID");
                    }
                }

                // Get the list of classes
                let classes = [];
                while (this._c === '.') {
                    this._next();
                    let c_class = this._getAttr();
                    if (c_class === null) {
                        return this._syntaxError("unexpected class");
                    }
                    classes.push(c_class);
                }

                // Get the attributes
                if (this._c === '(') {
                    this._next();
                    while (true) {
                        let attr = this._getAttr();
                        if (attr === null) {
                            return this._syntaxError("unexpected attribute");
                        }
                        this._eatblanks();
                        let value = null;
                        if (this._c === '=') {
                            this._next();
                            this._eatblanks();
                            value = this._getValue();
                        }
                        attrs[attr] = value;
                        if (this._c === ')') {
                            break;
                        }
                        if (this._c !== ',') {
                            return this._syntaxError("unexpected character");
                        }
                        this._next();
                    }
                    if (this._c !== ')') {
                        return this._syntaxError("expected )");
                    }
                    this._next();
                }

                this._eatblanks();
                results.push({ tag: tag, id: id, classes: classes, attrs: attrs });    

                if (this._c === null) {
                    break;
                }

                if (this._c !== '>') {
                    return this._syntaxError("expected > or EOF");
                }
            }
            return results;
        }
    }

    /**
     * Function that creates a new element from an object with the following structure:
     * {    tag: "tag_name",
     *      id: "id_name",
     *      classes: [ "class_name", ... ],
     *      attrs: { attr_name: "attr_value", attr_name: "attr_value", ... } }
     * 
     * @param {*} def - the definitio of the object
     * @returns an HTMLElement object
     */
    function createElement(def) {
        let el = document.createElement(def.tag);
        if (def.id !== null) {
            el.id = def.id;
        }
        for (let c of def.classes) {
            el.classList.add(c);
        }
        for (let k in def.attrs) {
            if (def.attrs[k] === null) {
                el.removeAttribute(k);
            } else {
                el.setAttribute(k, def.attrs[k]);
            }
        }
        return el;
    }

    /** Function that obtains a dictionary of attributes for a given element 
     * @param {HTMLElement} el the element to be parsed
     * @returns {Object} the dictionary of attributes
    */
    function getAttrs(el) {
        let attrs = {};
        for (let i = 0; i < el.attributes.length; i++) {
            let attr = el.attributes[i];
            attrs[attr.name] = attr.value;
        }
        return attrs;
    }

    /** Function that converts one element into other element using the [<tag>].<class1>.<class2>... notation 
     *      if ommited the <tag> name, it defaults to <div>
    */
    function convert(el, def) {
        // Make a deep copy of def structure for local modifications
        def = JSON.parse(JSON.stringify(def));

        // Classes are managed in other way
        let exception = [ "class" ];
        for (let prop of el.getAttributeNames()) {
            if (! exception.includes(prop)) {
                if (def.attrs[prop] === undefined)
                    def.attrs[prop] = el.getAttribute(prop);
            }
        }

        // Adding the classes
        for (let cls of el.classList) {
            def.classes.push(cls);
        }
        def.classes = arrayUnique(def.classes);

        let converted = createElement(def);
        converted.append(...el.childNodes)
        return converted;
    }

    /** Function to remove duplicate items from an array */
    function arrayUnique(ar) {
        return ar.filter(function(item, index) {
            return ar.indexOf(item) === index;
        });
    }

    // Now start conversions: each item is a tag that is to be converted into other tag
    function convertTags(conversions, options = {}) {
        if (conversions === undefined) {
            return;
        }

        let parser = new MicroParser();

        for (let o in conversions) {
            let conversion = conversions[o];
            let elements = parser.parse(conversion);

            let target = elements.pop();

            document.querySelectorAll(o).forEach((el) => {

                let root = null;
                let parent = null;
                let elAttrs = getAttrs(el);

                // Now check the intermediate values
                for (let element of elements) {
                    let created = createElement(element);
                    if (root === null) {
                        root = created;
                    }
                    if (parent !== null) {
                        parent.appendChild(created);
                    }
                    parent = created;
                }

                let converted = convert(el, target);
                let convertedAttrs = getAttrs(converted);

                for (let attrc in convertedAttrs) {
                    for (let attr in elAttrs) {
                        let attrVal = elAttrs[attr] || "";
                        convertedAttrs[attrc] = convertedAttrs[attrc].replace(`\$\{${attr}\}`, attrVal);
                    }
                }

                // Now set the replaced attributes
                for (let attr in convertedAttrs) {
                    converted.setAttribute(attr, convertedAttrs[attr]);
                }

                if (root === null) {
                    // Is the first, so we'll replace
                    el.parentNode.replaceChild(converted, el);
                } else {
                    // Is not the first, so we'll append
                    el.parentNode.replaceChild(root, el);
                    parent.appendChild(converted);
                }
            });
        }
    }

    /**
     * Function to add an <i> element if data-icon-left, data-icon or data-icon-right is present
     */
    function convertIcons(options) {
        let icons = arrayUnique([ ...document.querySelectorAll('[data-icon]'), ...document.querySelectorAll('[data-icon-right]'), ...document.querySelectorAll('[data-icon-left]') ]);
        
        icons.forEach(function(el) {
            if (el.dataset === undefined) {
                el.dataset = {};
            }
            let icon = el.dataset['icon'];
            let icon_left = el.dataset['iconLeft'];
            let icon_right = el.dataset['iconRight'];
            let icon_class = el.dataset['iconClass'];
        
            // icon-left is a synonym for data-icon-left 
            if (icon_left === undefined)
                icon_left = icon;
        
            // if an incon is set let's create it
            if ((icon_left !== undefined) || (icon_right !== undefined)) {
                let i = null;
                if (icon_left !== undefined) {
                    i = document.createElement('i');
                    icon_class = icon_class || options.icon_class;
                    i.classList.add(icon_class);
                    if (options.icon_as_class) {
                        i.classList.add(...icon_left.split(' '));
                    } else {
                        i.innerHTML = icon_left;
                    }
                    el.prepend(i);
                }
                if (icon_right !== undefined) {
                    i = document.createElement('i');
                    icon_class = icon_class || options.icon_class;
                    i.classList.add(icon_class);
                    if (options.icon_as_class) {
                        i.classList.add(...icon_right.split(' '));
                    } else {
                        i.innerHTML = icon_right;
                    }
                    el.appendChild(i);
                }
            }
        })
    }

    // Now make the magic upon document is ready
    if (document.addEventListener !== undefined) {
        document.addEventListener('DOMContentLoaded', function(e) {
            convertTags(window.synSugar.conversions || {});
            if (defaults.convert_icons) {
                convertIcons(defaults);
            }
        });
    }

    // Exports
    exports.synSugar = {
        configure: configure,
        convertTags: convertTags,
        convertIcons: convertIcons,
        conversions: {}
    }
})(window);