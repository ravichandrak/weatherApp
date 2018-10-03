$('document').ready(function() {
	var watchId;
	var weatherApiKey = '74ec58542bb5f132e474d5a59268408e';
	var googleApiKey = 'AIzaSyCavNvJykzfYAlCxZ-BG_e6rf6G_4g2eIY'; 
	
	var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
	var day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	var service;
	var cityLoaderStr = "<div class='loaderImg text-center'><img src='imgs/rolling.gif'/></div>";		
	
	if ("geolocation" in navigator) {	
		$('#mapContainer').before(cityLoaderStr);
		
		navigator.geolocation.getCurrentPosition(onSuccess, onFailure);
		//watchId = navigator.geolocation.watchPosition(onSuccess, onFailure);
		
	} else {
		alert("This app requires html5 features. Your browser does not support. please update it to latest version.");
	}
	
	var input = document.getElementById('cityTxtBox');
	
	var options = {
		types: ['(cities)'],
		componentRestrictions : { country : 'in' }
	};

	autocomplete = new google.maps.places.Autocomplete(input, options);
	
	autocomplete.addListener('place_changed', function() {
		var places = autocomplete.getPlace();
		
		if (places.length == 0) {
			return;
		}
		else
		{
			searchCity(places.name);
		}
	});
	
	
	function onSuccess(position)
	{
		saveUserLocation(position.coords.latitude, position.coords.longitude);
	}

	function onFailure(error)
	{
		var errorStr;
		switch(error.code) {
			case error.PERMISSION_DENIED:
				errorStr = '<div class="alert alert-danger"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>User denied the request for Geolocation.</div>';
				break;
			case error.POSITION_UNAVAILABLE:
				errorStr = '<div class="alert alert-danger"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>Location information is unavailable.</div>';
				break;
			case error.TIMEOUT:
				errorStr = '<div class="alert alert-danger"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>The request to get user location timed out.</div>';
				break;
			case error.UNKNOWN_ERROR:
				errorStr = '<div class="alert alert-danger"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>An unknown error occurred.</div>';
				break;
		}
		
		$('.loaderImg').hide();
		$('#mapContainer').before(errorStr);

		//setTimeout(closeErrorMsg, 5000);
	}
	
	function closeErrorMsg()
	{
		$('div.alert').alert('close');
	}
	
	/* function to show current city weather data and map */
	
	function saveUserLocation(latitude, longtude)
	{
		if (watchId != "undefined")
		{
			navigator.geolocation.clearWatch(watchId);
		}
		
		$.ajax({
			url : 'http://api.openweathermap.org/data/2.5/weather?lat=' + latitude + '&lon=' + longtude + '&units=metric&APPID=' + weatherApiKey,
			type : 'GET',
			success : function(response)
			{
				updateCityWeather(response);
				
				displayWeatherMap(latitude, longtude);				
			},
			error : function (jqXHR, textStatus, errorThrown)
			{}
		});	
	}
	
	/* city search based on city name */
	
	function searchCity(cityName)
	{
		var city = cityName;
		
		$('.loaderImg').show();
		$('#mapContainer').hide();
		
		if ($('div.alert').is(':visible'))
		{
			$('div.alert').alert('close');
		}
		
		if (city !== '')
		{
			$.ajax({
				url : 'http://api.openweathermap.org/data/2.5/weather?q=' + city + '&units=metric&APPID=' + weatherApiKey,
				type : 'GET',
				success : function(response)
				{
					updateCityWeather(response);
				},
				error : function (jqXHR, textStatus, errorThrown)
				{}
			});
		}
		else
		{
			
		}
	}
	
	/* updates the page with city wise response from openweather api */
	
	function updateCityWeather(response)
	{
		$('.loaderImg').hide();
		
		$('#mapContainer').show();
	
		var city = response.name;
		var dtTime = response.dt;
		
		var mainData = response.main;
		var wethrData = response.weather[0];
		var cityCoord = response.coord;
		
		var currHumidity = mainData.humidity;
		var curPressure = mainData.pressure;
		
		var temp = mainData.temp;
		var minTemprtr = mainData.temp_min;
		var maxTemprtr = mainData.temp_max;
		
		var a = new Date(dtTime * 1000);
		
		var cDay = day[a.getDay()];
		var cYear = a.getFullYear();
		var cDate = a.getDate();
		var cMonth = months[a.getMonth()];
		
		if (cDate < 10)
		{
			cDate = "0" + cDate;
		}
		
		if($('#mapContainer > div.cityInfo').length > 0)
			$('#mapContainer > div.cityInfo').remove();
		
		var cityStr = "<div class='cityInfo'><h3>" + city + " <small>Lat : " + cityCoord.lat + ", Long : " + cityCoord.lon + "</small></h3></div>";
		$('.cityPanel').before(cityStr);
		
		var c = cDay + ", " + cMonth + " " + cDate + ", " + cYear;
		$('.cityPanel').find('div.panel-heading').html(c);
		
		if (wethrData != null || wethrData != undefined)
		{
			var wDesc = wethrData.description;
			var wIcon = wethrData.icon;
			var wMain = wethrData.main;
			
			temp += "<sup>o</sup>C";
			maxTemprtr += "<sup>o</sup>C";
			minTemprtr += "<sup>o</sup>C";
			
			var str = "<div class='lead'><img src='http://openweathermap.org/img/w/" + wIcon + ".png'>" + temp + " " + wMain +"</div>";
			
			str += "<div>" + wDesc + " ~ High : " + maxTemprtr + " ~ Low : " + minTemprtr +"</div>";
			
			var footerStr = "Pressure : " + curPressure + " hPa ~ Humidity : " + currHumidity + "%";
			
			$('.cityPanel').find('div.panel-body').html(str);
			$('.cityPanel').find('div.panel-footer').html(footerStr);		
		
		
			displayWeatherMap(cityCoord.lat, cityCoord.lon);
		
		
		}
	}
	
	/* function to display google map with the selected city marker */
	function displayWeatherMap(lat, lon)
	{
		var latLong = new google.maps.LatLng(lat, lon);
		
		map = new google.maps.Map(document.getElementById('weatherMap'), {
			center: latLong,
			zoom: 15,
			mapTypeId: google.maps.MapTypeId.ROADMAP
        });
		
		marker = new google.maps.Marker({
			position : latLong,
			title : 'Mangalore'
		});
		
		marker.setMap(map);
		
	}
	
});