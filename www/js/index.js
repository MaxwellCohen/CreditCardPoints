    /*global $*/
    'use strict';
    // Wait for device API libraries to load
    //
    //document.addEventListener('deviceready', onDeviceReady, false);
    $(document).ready(onDeviceReady());
    // device APIs are available
    //
    function onDeviceReady() {
        navigator.geolocation.getCurrentPosition(onGeoSuccess, onError);

    }

    function showSelectedValues() {
        return($("input[name=MCC]:checked").map(
            function() {
                return this.value;
            }).get().join(","));
    }

    function submitPost() {
        $('#submit').html('please wait');
        var mccString = showSelectedValues();
        var lat = $('#latitude').html();
        var lon = $('#longitude').html();
        var dataStr = 'text=' + '' +
            '&is=' + '' +
            '&mcc=' + escape(mccString) +
            '&bei=' + '' +
            '&edl=' + '' +
            '&lat=' + escape(lat) +
            '&lon=' + escape(lon) +
            '&distLat=' + escape(lat) +
            '&distLon=' + escape(lon);

        var url = 'https://www.visa.com/supplierlocator/rest/search/supplier/desktop?' + dataStr;
        $('#results').html('loading ' + mccString);
        $.ajax({
            url: url,
            method: 'POST',
            success: function(data) {
                var $results = $('#results');
                var $lastItem = $results;
                $results.html('');
                // data.data[0].list.sort(function (a,b){
                //     return b.distance - .distance;
                // });
                $.each(data.data[0].list, function(index, val) {
                    var htmlString = '<div id="' + val.clientId + '">' +
                        '<ul>';
                    if ( val.websiteUrl.length > 0){
                        htmlString += '<li><a href="http://' + val.websiteUrl + '"><strong>' + val.name + '</strong></a></li>';
                    } else
                    {
                        htmlString += '<li><strong>' + val.name + '</strong></li>';
                    }
                        htmlString += '<li>' + val.industry + '</li>' +
                        '<li>' + val.distance.toFixed(2) + ' miles </li>' +
                        '<li>' + val.address1 + ' ' + val.address2 + '</li>' +
                        '<li>' + val.city + ' , ' + val.state + ' ' + val.zipCode + '</li>' +
                        '</ul></div>';
                    $results.append(htmlString);
                    $lastItem = $('#' + val.clientId);

                });
                $('#submit').html('submit');
                //html(JSON.stringify(data.data[0].list));
            },
            error: function() {
                alert('error');
            }

        });

    };
    // onSuccess Geolocation
    //
    function onGeoSuccess(position) {
            //var element = document.getElementById('geolocation');

            var url = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' +
                position.coords.latitude +
                ',' + position.coords.longitude +
                '&key=AIzaSyCDilyBmwUej93Au_S8UkiqNfLos4vna8s';
            $('#latitude').html(position.coords.latitude);
            $('#longitude').html(position.coords.longitude);
            $('#submit').html('');
            $('#submit').html('Submit');
           

            $.ajax({
                url: url,
                success: function(data) {
                    $('#formatted_address').html('Address ' + data.results[0].formatted_address);
                    $('#submit').click(function() {
                        submitPost();
                    });
                },
                error: function(data) {
                    alert('error' + data);
                }

            });

        }
        //

    // onError Callback receives a PositionError object
    //
    function onError(error) {
        alert('code: ' + error.code + '\n' +
            'message: ' + error.message + '\n');
    }