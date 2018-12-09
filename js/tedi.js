$(document).ready(function () {

  var api = 'http://apps.who.int/gho/athena/data/GHO/TOBACCO_0000000344,TOBACCO_0000000192.json?profile=simple&filter=COUNTRY:*;REGION:*;SEX:*';
  //$.getJSON('http://apps.who.int/gho/athena/data/GHO/TOBACCO_0000000344,TOBACCO_0000000192.json?profile=simple&filter=COUNTRY:*;REGION:*;SEX:*', function(data) {
  //  console.log(data);
  //})

  $.ajax({
    url: api,

    // The name of the callback parameter, as specified by the YQL service
    jsonp: "callback",

    // Tell jQuery we're expecting JSONP
    dataType: "jsonp",

    // Tell YQL what we want and that we want JSON
    data: {
      q: "select title,abstract,url from search.news where query=\"cat\"",
      format: "json"
    },

    // Work with the response
    success: function( response ) {
      var europe = [];
      var country = "Europe";
      var countries = [];
      var countryMap = {};
      for (var i = 0; i < response.fact.length; i++) {
        if (response.fact[i].dim.REGION == country) {
          europe.push(response.fact[i]);
        }
      }
      console.log( JSON.stringify(europe) ); // server response
    }
  });

  function WE_ARE_MACEDONIANS(text) {
    if ("The former Yugoslav republic of Macedonia" == text) {
      return "MACEDONIA";
    }
    return text;
  }

});