/* 
	Copyright 2016, Lucas Watson
	
	Hello there! Here's some simple code that gets information for us to display to the user.
	If you'd like to use this code, just shoot me an email at:
	
	Contact (at) LucasKWatson (dot) com
	
	This code can be viewed live at lucaskwatson.com/timezoned
	
	*/
var globalOffset; 							//This varriable stores the current UTC offset for the clock to use. Why not just have this value as a param in the
																//tick() function, that gets called every second? Because IE8 and 9 don't support function params in setTimeout().
															
function initAutocomplete() {		//This function gets called as a callback when the Google Browser API Loads. Timezone API is separate 
    
	var input = (document.getElementById('autocomplete')); 																												//define our input field
	var defaultBounds = new google.maps.LatLngBounds( 																														//set bounds to the entire world
	  new google.maps.LatLng(85, -180),
	  new google.maps.LatLng(-85, 180));
	var autocomplete = new google.maps.places.Autocomplete(input,{bounds: defaultBounds, types: ['(cities)']});		//Only search for cities, also
																																																								//initiate the object
	autocomplete.addListener('place_changed', function() {											//When the input field changes, call this function
	  var place = autocomplete.getPlace();																			//Get the place the user has selected from the drop down
	  if(place.geometry) {																											//If the place has coordinate values, excecute
      var coords = String(place.geometry.location);														
      //document.getElementById('latlong').innerHTML = coords;								//Hey, lets tell our user where this place is!
      plotMarker(coords);																											//call our function to plot on map
      
      coords = coords.replace(/[()]/g,'');																		//This cleans up our coord values so we can use them
      coords = coords.replace(' ','');																				//in the next API (Google doesn't like the commas and ())
      
      var d = new Date();																											//We need a date (don't worry, its casual, no formalwear required)
      var seconds = d.getTime() / 1000;																				//Lets convert it to seconds. Every one counts. 

      console.log("Current Time: "+seconds);
      
      var tzUrl = "https://maps.googleapis.com/maps/api/timezone/json?";			//This API allows us to get timezone data from google
      $.getJSON( tzUrl, {																											//It really should be in the Places API, but despite my 
          location: coords,																										//requests, they haven't done so (yet?).
          timestamp: seconds
          //key: 'AIzaSyCdi3Dm2kHmaVV5DQKKdfspUjr7PE09844'										//Key is unused in client-only environment.
        })
      .done(function( data ) {																								//Once we finish getting data and...
        if(data.status == 'OK') {																							//we confirm the data is valid...
          var dstStr = ' (+1 for DST)';
          if(data.dstOffset/3600 == 0) {
            dstStr = ' (+0 for DST)';
          }
          document.getElementById('offset').innerHTML = "UTC Offset: "+(data.rawOffset/3600)+dstStr;
          //document.getElementById('utc').innerHTML = "UTC Offset: "+(data.rawOffset/3600); 		//we show it to the user!
          //document.getElementById('dst').innerHTML = "DST Offset: "+(data.dstOffset/3600);
          document.getElementById('zone').innerHTML = "Timezone: "+data.timeZoneName;
          //document.getElementById('zoneid').innerHTML = "Timezone ID: "+data.timeZoneId;
          globalOffset = (data.rawOffset/3600)+(data.dstOffset/3600);
          console.log("Global Offset: "+globalOffset);
					tick(globalOffset);
        }else{																																								//if the data is invalid, tell us why!
          console.log("Timezone API ERROR: Status: "+data.status);
          if(data.errorMessage) {
            console.log("Err msg: "+data.errorMessage);
            //document.getElementById('utc').innerHTML = 'Sorry, we are unable to get valid data from Google right now.';
          }
        }
      })
      .fail(function() {																												//if the request failed, just say it did :/
        //document.getElementById('utc').innerHTML = 'Sorry, we are unable to get data from Google right now.';
      });
	  }
	});
}

function plotMarker(coords){																											//This function takes our coordinate values and plots them!
  var split = coords.indexOf(',');																								//Since the coordinates are one string, we find where the "," is

	//and then get the numerical values from the string, and round any errors
  var lat = Number(Math.round(  parseFloat(coords.substring(1, split),10) +'e7')+'e-7');		
  var long = Number(Math.round( parseFloat(coords.substring(split+1,coords.length-1),10) +'e7')+'e-7');
  
  document.getElementById('lat').innerHTML = "Latitude: "+lat;										//and display them
  document.getElementById('long').innerHTML = "Longitude: "+long;
  
  console.log(lat+", "+long);																											//for debugging, we log the values

  document.getElementById("marker").style.top = (100-((lat+90)/180)*100) + "%";		//and finally set the top and left values for the given point
  document.getElementById("marker").style.left = ((long+180)/360)*100 + "%";			//in the form of a percentile, which is calculated from the coords
  
  document.getElementById("clock").style.left = (((long+180)/360)*100)-((60/screen.width)*100) + "%";	//Make the clock line up with our geo point
  console.log((60/screen.width)*100);
}	

function getClockTime(offset) {
	var t = new Date();
	var minOff = (((globalOffset-offset)%1)*60) + t.getUTCMinutes();								//READ ME!!

	t.setUTCHours(((globalOffset-offset)+1),minOff);																//Yes, this code is a bit messy. There is a simpler way
  var h = t.getHours();																														//to replace (globalOffset-offset) with better code
  var m = t.getMinutes();																													//BUT it isn't supported with IE8.
  var s = t.getSeconds();																	
  m = (m < 10) ? "0"+m : m;
  s = (s < 10) ? "0"+s : s;
  return h+":"+m+":"+s;
}

function tick(offset) {
	var t = new Date();
	document.getElementById('local').innerHTML = "Local Time: "+getClockTime(globalOffset);	
	document.getElementById('clock').innerHTML = getClockTime((-1*(t.getTimezoneOffset()/60)));
	setTimeout(tick, 1000);																													//in a few years, when IE8 is deprecated, add the third param
}
