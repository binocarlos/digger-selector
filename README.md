# digger-selector

The CSS selector parser used for digger

## installation

	$ npm install digger-selector

## example

```js
var Selector = require('digger-selector');

var parsed = Selector(' > * product.onsale[price<100] > img caption.red, friend');
```

parsed would be this data structure:

```js
{
 "selector": " > * product.onsale[price<100] > img caption.red, friend",
  "phases":[
    [
      {
        "splitter": ">",
        "tag": "*"
      },
      {
        "splitter": "",
        "tag": "product",
        "classnames": {
          "onsale": true
        },
        "attr": [
          {
            "field": "price",
            "operator": "<",
            "value": "100"
          }
        ]
      },
      {
        "splitter": ">",
        "tag": "img"
      },
      {
        "splitter": "",
        "tag": "caption",
        "classnames": {
          "red": true
        }
      }
    ],
    [
      {
        "tag": "friend"
      }
    ]
  ]
}
```

## licence
MIT