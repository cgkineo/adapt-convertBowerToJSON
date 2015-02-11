# adapt-convertBowerToJSON
Convert Bower registry to a JSON registry

```

var var1 = require("adapt-convertBowerToJSON");

var gulppipe = var1.download("url", function begin() {
      
      },
      function progress(state) {
        /*
          state.received
          state.total
          state.percent
        */
      },
      function complete() {
      
      })
      .pipe( ... );
      
      

var qpromise = var1.convertBowerToJSON("http://adapt-bower-repository.herokuapp.com/packages/", "master")
  .then(function doSomething(registry) {
      /* 
      registry = {
        components: [
          {
            "name": "adapt-contrib-accordion",
            "repo": "adaptlearning",
            "branch": master
          },
          ...
        ],
        extensions: [],
        themes: [],
        menus: []
      }  
      */
      
      //do something here
  });

```
