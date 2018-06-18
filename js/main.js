'use strict';

var myLocations = [
	{
		name: 'Planet Goa Beach Resort',
		lat: 15.4616158,
		long: 73.7916639
	},
	{
		name: 'Marbela Beach Resort',
		lat: 15.3437144,
		long: 73.4517583
	},
	{
		name: 'Calangute Beach',
		lat: 15.5371699,
		long: 73.7525658
	},
	{
		name: 'Osho Beach',
		lat: 15.5371699,
		long: 73.7525658
	},
	{
		name: 'Baga Beach',
		lat: 15.5567185,
		long: 73.7463912
	},
	{
		name: 'Mhadei Wildlife Sanctuary',
		lat: 15.3465132,
		long: 73.4517856
	},
	{
		name: 'Querim Beach',
		lat: 15.3623228,
		long: 73.5781172
	},
	{
		name: 'Anjuna Beach',
		lat: 15.3623228,
		long: 73.5781172
	}

];

// Declaring global variables now to satisfy strict mode
var map;
var clientID;
var clientSecret;
var infoWindow;





//Get the valid Phone number
function formatPhone(phonenum) {
    var regexObj = /^(?:\+?1[-. ]?)?(?:\(?([0-9]{3})\)?[-. ]?)?([0-9]{3})[-. ]?([0-9]{4})$/;
    if (regexObj.test(phonenum)) {
        var parts = phonenum.match(regexObj);
        var phone = "";
        if (parts[1]) { phone += "+1 (" + parts[1] + ") "; }
        phone += parts[2] + "-" + parts[3];
        return phone;
    }
    else {
        //invalid phone number
        return phonenum;
    }
}

var Location = function(base) {
	var self = this;
	this.name = base.name;
	this.lat = base.lat;
	this.long = base.long;
	this.URL = "";
	this.street = "";
	this.city = "";
	this.phone = "";
    
    //visible determines whether to show the restaurant on the map
	this.visible = ko.observable(true);

	var foursquareURL = 'https://api.foursquare.com/v2/venues/search?ll='+ this.lat + ',' + this.long + '&client_id=' + clientID + '&client_secret=' + clientSecret + '&v=20160118' + '&query=' + this.name;
    
    //Using Foursquare API to get info about the restaurant
	$.getJSON(foursquareURL).done(function(base) {
		var results = base.response.venues[0];
		self.URL = results.url;
		if (typeof self.URL === 'undefined'){
			self.URL = "";
		}
		self.street = results.location.formattedAddress[0];
     	self.city = results.location.formattedAddress[1];
      	self.phone = results.contact.phone;
      	if (typeof self.phone === 'undefined'){
			self.phone = "";
		} else {
			self.phone = formatPhone(self.phone);
		}
	}).fail(function() {
		alert("There was an error with the Foursquare API call. Please refresh the page and try again to load Foursquare data.");
	});

    
	//Making the marker
	this.marker = new google.maps.Marker({
			position: new google.maps.LatLng(base.lat, base.long),
			map: map,
			title: base.name
	});
    
    //Making the info window
	infoWindow = new google.maps.InfoWindow();
    
    //Show the restaurant if it is visible
	this.showMarker = ko.computed(function() {
		if(this.visible() === true) {
			this.marker.setMap(map);
		} else {
			this.marker.setMap(null);
		}
		return true;
	}, this);

	

    this.showinfo = function(){
    	
    	//close previous info window
    	infoWindow.close()
    	//Get the info about the restaurant
		var contentString = '<div class="info-window-content"><div class="title"><b>' + base.name + "</b></div>" +
        '<div class="content"><a href="' + self.URL +'">' + self.URL + "</a></div>" +
        '<div class="content">' + self.street + "</div>" +
        '<div class="content">' + self.city + "</div>" +
        '<div class="content"><a href="tel:' + self.phone +'">' + self.phone +"</a></div></div>";

        infoWindow.setContent(contentString);

		infoWindow.open(map, this);

		self.marker.setAnimation(google.maps.Animation.BOUNCE);
      	//Stop the animation
      	setTimeout(function() {
      		self.marker.setAnimation(null);
     	}, 2100);

    };

	this.marker.addListener('click', self.showinfo);
    
    //Click the restaurant on the table
	this.bounce = function() {
		google.maps.event.trigger(self.marker, 'click');
	};

	
};

function AppViewModel() {
	var self = this;

	this.searchTerm = ko.observable("");

	this.locationList = ko.observableArray([]);

	map = new google.maps.Map(document.getElementById('map'), {
			zoom: 7,
			center: {lat: 15.3465132, lng: 74.4517856}

	});
	var bounds = new google.maps.LatLngBounds();
	for (var i = 0; i < myLocations.length; i++){

        bounds.extend(new google.maps.LatLng(myLocations[i].lat,myLocations[i].long));
	}
	
	map.fitBounds(bounds);

	// Foursquare API settings
	clientID = "QO0NO0GE41H0NR0AWG00AK2LJGBR0KK4KVURVVEO41ALXJQX";
	clientSecret = "VBXIBDTSJBPZ3BMKYQGKL5FPAUHDQ0VJGLEX1450ATOIJRHG";

    // Make "Location" object
	myLocations.forEach(function(locationItem){
		self.locationList.push( new Location(locationItem));
	});
    //Determine the visible restaurants after searching
	this.filteredList = ko.computed( function() {
		var filter = self.searchTerm().toLowerCase();
		if (!filter) {
			self.locationList().forEach(function(locationItem){
				locationItem.visible(true);
			});
			return self.locationList();
		} else {
			return ko.utils.arrayFilter(self.locationList(), function(locationItem) {
				var string = locationItem.name.toLowerCase();
				var result = (string.search(filter) >= 0);
				locationItem.visible(result);
				return result;
			});
		}
	}, this);

	this.mapElem = document.getElementById('map');
	//this.mapElem.style.height = window.innerHeight - 50;
    //responsive design
	this.clickItem = (function(){
	  // If menu is already showing, slide it up. Otherwise, slide it down.
	  $('.lists').toggleClass('slide-down');
	  //If the "burger" is clicked, change the background color
	  $('.item').toggleClass('clicked');

	});


}

function startApp() {
	ko.applyBindings(new AppViewModel());
}

function errorHandling() {
	alert("Google Maps has failed to load. Please check your internet connection and try again.");
}
