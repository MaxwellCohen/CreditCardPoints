    // This example uses the autocomplete feature of the Google Places API.
    // It allows the user to find all hotels in a given place, within a given
    // country. It then displays markers for all the hotels returned,
    // with on-click details for each hotel.
    'use strict';
    var ccpAPP =(function(){
    /* global google */
    /* global escape */
    var map, infoWindow, geolocation;
    var markers = [];
    var autocomplete;
    var auotCompleteHTML = document.getElementById('autocomplete');
    var infoContenHTML = document.getElementById('info-content');
    var resultsHTML = document.getElementById('results');
    var mapHTML = document.getElementById('map');
    var MARKER_PATH = 'https://maps.gstatic.com/intl/en_us/mapfiles/marker_green';
    var circle;

    var searchHTML = document.getElementById('search');
    searchHTML.addEventListener('click', search);


    function initMap() {
        map = new google.maps.Map(mapHTML, {
            zoom: 15,
            center: {
                lat: 41.8960466,
                lng: -87.65563939999998
            },
            mapTypeControl: false,
            streetViewControl: false
        });
        geolocate();
        //mapHTML.style.height = window.innerHeight;
        infoWindow = new google.maps.InfoWindow({
            content: infoContenHTML
        });

        // Create the autocomplete object and associate it with the UI input control.
        autocomplete = new google.maps.places.Autocomplete(
            (
                auotCompleteHTML), {
                types: ['geocode']
            });

        autocomplete.addListener('place_changed', onPlaceChanged);
    }

    // When the user selects a city, get the place details for the city and
    // zoom the map in on the city.
    function onPlaceChanged() {
        var place = autocomplete.getPlace();
        if (place.geometry) {
            map.panTo(place.geometry.location);
            setCurrentLocation(place.geometry.location, 10);
            map.setZoom(16);
            //search();
        } else {
            auotCompleteHTML.placeholder = 'Enter an address';
        }
    }

    // Search for hotels in the selected city, within the viewport of the map.
    function search() {
        var place = autocomplete.getPlace();
        var lat, lng;
        if (place) {
            lat = place.geometry.location.lat();
            lng = place.geometry.location.lng();
        } else if (geolocation) {
            lat = geolocation.lat;
            lng = geolocation.lng;
        }
        if (lat !== undefined) {
            var mccString = showSelectedValues();
            var dataStr = 'text=' + '' +
                '&is=' + '' +
                '&mcc=' + escape(mccString) +
                '&bei=' + '' +
                '&edl=' + '' +
                '&lat=' + escape(lat) +
                '&lon=' + escape(lng) +
                '&distLat=' + escape(lat) +
                '&distLon=' + escape(lng);

            var url = 'https://www.visa.com/supplierlocator/rest/search/supplier/desktop?' + dataStr;
            //$('#results').html('loading ' + mccString);
            resultsHTML.innerHTML = 'Loading';
            var request = new XMLHttpRequest();
            request.open('POST', url, true);
            request.onload = function() {
                if (request.status >= 200 && request.status < 400) {
                    // Success!
                    var data = JSON.parse(request.responseText);
                    listResults(data);
                } else {
                    resultsHTML.innerHTML = 'error please try again';
                }
            };
            request.onerror = function() {
                resultsHTML.innerHTML = 'error please try again';
            };
            request.send();
        }
    }

    function showSelectedValues() {
        var elList = document.querySelectorAll('input[name=MCC]:checked');
        var s = '';
        for (var i = 0; i < elList.length; i++) {
            s += ',' + elList[i].value;
        }
        return s.slice(1);
    }


    var listResults = function(data) {
        if (data.responseCode === 'OK') {
            clearResults();
            clearMarkers();
            var results = data.data[0].list;
            for (var i = 0; i < Math.min(results.length, 26); i++) {
                var markerLetter = String.fromCharCode('A'.charCodeAt(0) + i);
                var markerIcon = MARKER_PATH + markerLetter + '.png';
                markers[i] = new google.maps.Marker({
                    position: {
                        lat: results[i].lat,
                        lng: results[i].lon
                    },
                    animation: google.maps.Animation.DROP,
                    icon: markerIcon
                });
                markers[i].placeResult = results[i];
                google.maps.event.addListener(markers[i], 'click', showInfoWindow);
                setTimeout(dropMarker(i), i * 100);
                addResult(results[i], i);
            }
        }
    };


    function clearMarkers() {
        for (var i = 0; i < markers.length; i++) {
            if (markers[i]) {
                markers[i].setMap(null);
            }
        }
        markers = [];
    }


    function dropMarker(i) {
        return function() {
            markers[i].setMap(map);
        };
    }

    function addResult(result, i) {
        var results = resultsHTML;
        var markerLetter = String.fromCharCode('A'.charCodeAt(0) + i);
        var markerIcon = MARKER_PATH + markerLetter + '.png';

        var tr = document.createElement('tr');
        tr.style.backgroundColor = (i % 2 === 0 ? '#F0F0F0' : '#FFFFFF');
        tr.onclick = function() {
            google.maps.event.trigger(markers[i], 'click');
        };

        var iconTd = document.createElement('td');
        var nameTd = document.createElement('td');
        var icon = document.createElement('img');
        icon.src = markerIcon;
        icon.setAttribute('class', 'placeIcon');
        icon.setAttribute('className', 'placeIcon');
        var name = document.createTextNode(result.name);
        iconTd.appendChild(icon);
        nameTd.appendChild(name);
        tr.appendChild(iconTd);
        tr.appendChild(nameTd);
        results.appendChild(tr);
    }

    function clearResults() {
        var results = resultsHTML;
        while (results.childNodes[0]) {
            results.removeChild(results.childNodes[0]);
        }
    }

    // Get the place details for a hotel. Show the information in an info window,
    // anchored on the marker for the hotel that the user selected.
    function showInfoWindow() {
        var marker = this;
        infoWindow.open(map, marker);
        buildIWContent(marker.placeResult);

    }

    // Load the place information into the HTML elements used by the info window.
    function buildIWContent(val) {
        var htmlString = '<div id="' + val.cdiventId + '">' +
            '<ul>';
        if (val.websiteUrl.length > 0) {
            htmlString += '<div><a href="http://' + val.websiteUrl + '"><strong>' + val.name + '</strong></a></div>';
        } else {
            htmlString += '<div><strong>' + val.name + '</strong></div>';
        }
        htmlString += '<div>' + val.industry + '</div>' +
            '<div>' + val.distance.toFixed(2) + ' miles </div>' +
            '<div>' + val.address1 + ' ' + val.address2 + '</div>' +
            '<div>' + val.city + ' , ' + val.state + ' ' + val.zipCode + '</div>' +
            '</ul></div>';
        infoContenHTML.innerHTML = htmlString;
    }

    function geolocate() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                geolocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                setCurrentLocation(geolocation, position.coords.accuracy);
                map.panTo(geolocation);
                var geocoder = new google.maps.Geocoder();

                var latLng = geolocation.lat + ',' + geolocation.lng;
                auotCompleteHTML.value = latLng;
                geocoder.geocode({
                    'location': geolocation
                }, function(results, status) {
                    if (status === google.maps.GeocoderStatus.OK) {
                        if (results[1]) {
                            auotCompleteHTML.value = results[1].formatted_address;
                        } else {
                            auotCompleteHTML.value = ('No results found');
                        }
                    } else {
                        auotCompleteHTML.value = ('Geocoder failed due to: ' + status);
                    }
                });
            });
        }
    }

    function setCurrentLocation(location, radius) {
        if (circle) {
            circle.setMap(null);
        }
        circle = new google.maps.Circle({
            strokeColor: '#0000ff',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#0000ff',
            center: location,
            radius: radius,
            map: map
        });
    }

    return{
        init:initMap,
        search:search
    };

}());
