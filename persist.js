
var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
var observer = new MutationObserver(function(mutations) {
        saveState();
  });


  const storagePrefix = "state.";
  const propertyPrefix = "$property.";

  var watchedElements ={
      '#chord-color':propertyPrefix+'value',
      '#tonic-enabled':propertyPrefix+'checked',
      '#tonic-degree-enabled':propertyPrefix+'checked',

      '#alt-color':propertyPrefix+'value',
      '#alt-enabled':propertyPrefix+'checked',

      '#tonic-color':propertyPrefix+'value',


      '#label-size':propertyPrefix+'value',
      '#label-color':propertyPrefix+'value',

      '#arrow-color':propertyPrefix+'value',
      '#arrow-thickness':propertyPrefix+'value',
      '#arrow-simplification':propertyPrefix+'value',
      '#arrow-transparency':propertyPrefix+'value',
      '#arrow-snap':propertyPrefix+'checked',
      '#fill-circlefill':propertyPrefix+'checked',


      '#fill-bgcolor':propertyPrefix+'value',
      '#fill-margin':propertyPrefix+'value',
      '#settings-width':propertyPrefix+'value',
  };

window.addEventListener('load', function () {
    restoreState();

    //Start observing attribute changes on persisted elements

    for (const selector in watchedElements) {

        var target = document.querySelector(selector);

        if(null == target)
            continue;
        
        target.addEventListener('input', function(){saveState();});

        observer.observe(target,{attributes:true});
    }

    redraw();
});


function saveState()
{
    for (const selector in watchedElements) {

        var attributeOrProperty = watchedElements[selector];

        var target = document.querySelector(selector);

        if(null == target)
            continue;
        
        var value = target.getAttribute(attributeOrProperty);

        if(attributeOrProperty.startsWith(propertyPrefix))
            value = target[attributeOrProperty.substring(propertyPrefix.length)];

        localStorage.setItem(storagePrefix+selector,JSON.stringify(value));
    }
}

function restoreState()
{
    for (const selector in watchedElements) {

        var attributeOrProperty = watchedElements[selector];
        var value = localStorage.getItem(storagePrefix+selector);

        if(undefined == value)
            continue;

        value = JSON.parse(value);

        var target = document.querySelector(selector);

        if(null == target)
            continue;

        
        if(attributeOrProperty.startsWith(propertyPrefix))
            target[attributeOrProperty.substring(propertyPrefix.length)] = value;
        else
            target.setAttribute(attributeOrProperty,value);
    }
}