# digger-selector

The CSS selector parser used for digger

## installation

	$ npm install digger-selector

## example

```js
var Selector = require('digger-selector');

var parsed = Selector('product[price<=100] > caption.big, friend');
```

parsed would be this data structure:

```js
{
    "string": "product[price<=100] > caption.big, friend",
    "phases": [
        [
            {
                "string": "product[price<=100]",
                "class": {},
                "attr": [
                    {
                        "field": "price",
                        "operator": "<=",
                        "value": "100"
                    }
                ],
                "modifier": {},
                "tag": "product"
            },
            {
                "string": " > caption.big",
                "class": {
                    "big": true
                },
                "attr": [],
                "modifier": {},
                "splitter": ">",
                "tag": "caption"
            }
        ],
        [
            {
                "string": "friend",
                "class": {},
                "attr": [],
                "modifier": {},
                "tag": "friend"
            }
        ]
    ]
}
```

## licence
MIT