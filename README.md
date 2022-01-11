# Syntax Sugar for HTML (synSugar)

This is a project that provides some syntactic sugar to write HTML documents. At the end, _synSugar_ converts some HTML tags into other HTML tags, with added or modified attributes.

The underlying idea is that we repeat a lot of code when creating HTML web pages, and it would be nice to simplify such code. Consider the next fragment of HTML code of a web page that uses [bootstrap](https://bootstrap.com):

```html
<button class="btn btn-primary"><i class="fas fa-home">Home</button>
<button class="btn btn-primary"><i class="fas fa-arrow-up"></button>
<button class="btn btn-primary"><i class="fas fa-arrow-down"></button>
<button class="btn btn-primary"><i class="fas fa-arrow-left"></button>
<button class="btn btn-primary"><i class="fas fa-arrow-right"></button>
```

Using _synSugar_ it is possible to simplify such code to the next code:

```html
<button data-icon="fa-home">Home</button>
<button data-icon="fa-arrow-up"></button>
<button data-icon="fa-arrow-down"></button>
<button data-icon="fa-arrow-left"></button>
<button data-icon="fa-arrow-right"></button>
```

Then you simply have to add the translation for the tags (the `data-icon` is an addon for _synSugar_):

```html
<script>
synSugar.conversions = {
    "button": "button.btn.btn-primary"
}
</script>
```

The cool thing for this kind of translations is that, if you wanted to change the whole design (e.g. changing `btn-primary` to `btn-outline-primary`), it is very straightforward to change the _conversion_ in _synSugar_, instead of changing every single appearence of `btn-primary`.

## Installing

There is a single _javascript_ file that contains the library. 

```console
# git clone https://github.com/dealfonso/synsugar
```

```html
<script src="synsugar.js"></script>
```

### From a CDN

It is possible to use `synsugar` directly from a CDN:

```html
<script src="https://cdn.jsdelivr.net/gh/jsutilslib/synsugar@1.0.0/synsugar.min.js"></script>
```

## Using

_synSugar_ can be used for translating existing elements in the HTML DOM into other elements, either modifying the type of element or not (e.g. a list item can be translated into a list item with an inner link). Moreover, using _synSugar_ it is posible to add classes and/or update the attributes of the translated elements. Even _synSugar_ can be used for only updating these attributes (e.g. adding classes to a type of elements).

Let's explain _synSugar_ by examples.

Having an element like the next one:

```html
<a href="https://www.google.com">Get to google</a>
```

It is possible to convert it to a button by simply defining the next rule:

```javascript
'a': "button(onclick='javascript:window.location=\"${href}\"')"
```

Then, the resulting HTML fragment will be the next one (_the `a` link is now a `button` element_):

```html
<button onclick="window.open('https://www.google.es')" href="https://www.google.es">Get to google</button>
```

### More examples

#### Custom lists

If we wanted a list in which we had several options (e.g. double, normal or small), with links to apply the size, the html code may be like the next one:
```html
<ul class="list list-group class1 class2">
    <li class="list-group-item"><a class="btn btn-outline-primary btn-sm" onclick="apply(2)" data-icon="fa-chevron-up me-1"><i class="fas fa-chevron-up me-1"></i>large</a></li>
    <li class="list-group-item"><a class="btn btn-outline-primary btn-sm" onclick="apply(1)" data-icon="fa-minus"><i class="fas fa-minus"></i>normal</a></li>
    <li class="list-group-item"><a class="btn btn-outline-primary btn-sm" onclick="apply(0.5)" data-icon="fa-chevron-down"><i class="fas fa-chevron-down"></i>small</a></li>
</ul>
```

It is a bit ugly because of the repetition of parts of the code. Using _synSugar_, the code may be like the next one:

```html
<list class="class1 class2">
    <li value="2" data-icon="fa-chevron-up">large</li>
    <li value="1" data-icon="fa-minus">normal</li>
    <li value="0.5" data-icon="fa-chevron-down">small</li>
</list>

<script>
synSugar.conversions = {
    'list li': 'li.list-group-item>a.btn.btn-outline-primary.btn-sm(href=null,onclick="apply(${value})",value=null)',
    'list': 'ul.list.list-group'
}
</script>
```

_synSugar_ will obtain the same code than the HTML in the fragment before, using a more clean code. Moreover, if we wanted to change from links (i.e. `a`) to buttons (i.e. `button`), the change will be very easy. The same applies to use Bootstraps's `a.list-group-item-action` instead of `li` and an inner `a`.

> As shown in the example, _synSugar_ works either with existing HTML tags (e.g `li`) as with custom tags (e.g. `list`).

The working example can be seen [at codepen](https://codepen.io/dealfonso/pen/xxXyaoE)

#### Custom toolbar

I have defined a set of custom HTML tags to create toolbars. My toolbar is the next:

```html
<toolbar>
    <button-group>
        <button data-icon="fa-arrow-up"></button>
        <button data-icon="fa-arrow-down"></button>
    </button-group>
    <divider></divider>
    <button-group>
        <button data-icon="fa-search-plus"></button>
        <menu id="menu1">
            <menu-title>
                Zoom
            </menu-title>
            <menu-content>
                <option>50%</option>
                <option>100%</option>
                <option>150%</option>
                <option>200%</option>
            </menu-content>
        </menu>
        <button data-icon="fa-search-minus"></button>
    </button-group>
    <divider></divider>
    <button-group>
        <menu>
            <menu-title data-icon-right="fa-angle-double-right">
            </menu-title>
            <menu-content>
                <option>Portrait</option>
                <option>Landscape</option>
                <divider></divider>
                <option>Fit Page</option>
                <option>Fit Width</option>
            </menu-content>
        </menu>
    </button-group>
</toolbar>
```

Using that fragment of custom code, and the next translations, I am able to get a full featured toolbar that is very easy to extend, update or modify (due to the very clear code):

```javascript
<script>
synSugar.configure({
    icon_as_class: true,
    icon_class: "fas",
})
synSugar.conversions = {
    "toolbar button-group:first-child button:first-child": 'button.ms-1',
    "toolbar button-group button": 'button.btn.btn-primary.me-1',
    "toolbar button-group": '.button-group',
    "toolbar menu": '.dropdown(aria-label="id-${id}")',
    "toolbar menu-title[data-icon],toolbar menu-title[data-icon-left],toolbar menu-title[data-icon-right]": 'button.btn.btn-sm(type="button", data-bs-toggle="dropdown", aria-expanded="false")',
    "toolbar menu-title": 'button.btn.btn-sm.dropdown-toggle(type="button", data-bs-toggle="dropdown", aria-expanded="false")',
    "toolbar menu-content option": 'li.dropdown-item>a.dropdown-item',
    "toolbar menu-content divider": "li>hr.dropdown-divider",
    "toolbar menu-content": 'ul.dropdown-menu',
    "toolbar divider": '.divider',
    "toolbar": '.toolbar',
}
</script>
```

The working example can be seen [at codepen](https://codepen.io/dealfonso/pen/qBPJMvq)



