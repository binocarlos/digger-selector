/*

  (The MIT License)

  Copyright (C) 2005-2013 Kai Davenport

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

/*
  Module dependencies.
*/

module.exports = parse;
module.exports.mini = miniparse;

/*
  Quarry.io Selector
  -------------------

  Represents a CSS selector that will be passed off to selectors or perform in-memory search

 */

/***********************************************************************************
 ***********************************************************************************
  Here is the  data structure:

  "selector": " > * product.onsale[price<100] > img caption.red, friend",
  "phases":
    [
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

 */

/*
  Regular Expressions for each chunk
*/

var chunkers = [
  // the 'type' selector
  {
    name:'tag',
    regexp:/^(\*|\w+)/,
    mapper:function(val, map){
      map.tag = val;
    }
  },
  // the '.classname' selector
  {
    name:'class',
    regexp:/^\.\w+/,
    mapper:function(val, map){
      map.class = map.class || {};
      map.class[val.replace(/^\./, '')] = true;
    }
  },
  // the '#id' selector
  {
    name:'id',
    regexp:/^#\w+/,
    mapper:function(val, map){
      map.id = val.replace(/^#/, '');
    }
  },
  // the '=diggerid' selector
  {
    name:'diggerid',
    regexp:/^=[\w-]+/,
    mapper:function(val, map){
      map.diggerid = val.replace(/^=/, '');
    }
  },
  // the ':modifier' selector
  {
    name:'modifier',
    regexp:/^:\w+(\(.*?\))?/,
    mapper:function(val, map){
      map.modifier = map.modifier || {};
      var parts = val.split('(');
      var key = parts[0];
      val = parts[1];

      if(val){
        val = val.replace(/\)$/, '');

        if(val.match(/^[\d\.-]+$/)){
          val = JSON.parse(val);
        }

      }
      else{
        val = true;
      }

      map.modifier[key.replace(/^:/, '')] = val;
    }
  },
  // the '[attr<100]' selector
  {
    name:'attr',
    regexp:/^\[.*?["']?.*?["']?\]/,
    mapper:function(val, map){
      map.attr = map.attr || [];
      var match = val.match(/\[(.*?)([=><\^\|\*\~\$\!]+)["']?(.*?)["']?\]/);
      if(match){
        map.attr.push({
          field:match[1],
          operator:match[2],
          value:match[3]
        });
      }
      else {
        map.attr.push({
          field:val.replace(/^\[/, '').replace(/\]$/, '')
        });
      }
    }
  },
  // the ' ' or ' > ' splitter
  {
    name:'splitter',
    regexp:/^[ ,<>]+/,
    mapper:function(val, map){
      map.splitter = val.replace(/\s+/g, '');
    }

  }
];


/*
  Parse selector string into flat array of chunks
 
  Example in: product.onsale[price<100]
 */
function parseChunks(selector){

  var lastMatch = null;
  var workingString = selector ? selector : '';
  var lastString = '';

  // this is a flat array of type, string pairs
  var chunks = [];

  var matchNextChunk = function(){

    lastMatch = null;

    for(var i in chunkers){
      var chunker = chunkers[i];

      if(lastMatch = workingString.match(chunker.regexp)){

        // merge the value into the chunker data
        var data = {
          value:lastMatch[0]
        }
        for(prop in chunker){
          data[prop] = chunker[prop];
        }
        chunks.push(data);

        workingString = workingString.replace(lastMatch[0], '');

        return true;
      }
    }
    
    return false;

  }
  
  // the main chunking loop happens here
  while(matchNextChunk()){
    
    // this is the sanity check in case we match nothing
    if(lastString==workingString){
      break;
    }
  }

  return chunks;
}

function new_selector(){
  return {
    class:{},
    attr:[],
    modifier:{}
  }
}

/*

  turns a selector string into an array of arrays (phases) of selector objects
 
 */
function parse(selector_string){

  if(typeof(selector_string)!='string'){
    return selector_string;
  }

  var chunks = parseChunks(selector_string);

  var phases = [];
  var currentPhase = [];
  var currentSelector = new_selector();

  var addCurrentPhase = function(){
    if(currentPhase.length>0){
      phases.push(currentPhase);
    }
    currentPhase = [];
  }

  var addCurrentSelector = function(){

    if(Object.keys(currentSelector).length>0){
      currentPhase.push(currentSelector);
    }
    currentSelector = new_selector();
  }

  var addChunkToSelector = function(chunk, selector){
    
    chunk.mapper.apply(null, [chunk.value, selector]);
  }


  chunks.forEach(function(chunk, index){

    if(chunk.name=='splitter' && chunk.value.match(/,/)){
      addCurrentSelector();
      addCurrentPhase();
    }
    else{

      if(chunk.name=='splitter' && index>0){
        addCurrentSelector();
      }

      addChunkToSelector(chunk, currentSelector);

    }
  })

  addCurrentSelector();
  addCurrentPhase();

  return {
    string:selector_string,
    phases:phases
  }
}

function miniparse(selector_string){

  if(typeof(selector_string)!=='string'){
    return selector_string;
  }
  selector_string = selector_string || '';
  var selector = {
    class:{},
    modifier:{}
  }
  selector_string = selector_string.replace(/_(\w+)/, function(match, id){
    selector.id = id;
    return '';
  })
  selector_string = selector_string.replace(/\.(\w+)/g, function(match, classname){
    selector.class[classname] = true;
    return '';
  })
  if(selector_string.match(/\d/)){
    selector.diggerid = selector_string;
  }
  else{
    selector.tag = selector_string;
  }
  return selector;
}