/**
 * Place search (Overpass API) and attraction selection.
 */
(function () {
  'use strict';
  var Sp = window.Spacerek;
  var state = Sp.state;
  var config = Sp.config;

  var OVERPASS_FETCH_TIMEOUT_MS = 25000;

  function fetchWithTimeout(url, options, timeoutMs) {
    var timeoutId;
    var timeoutPromise = new Promise(function (_, reject) {
      timeoutId = setTimeout(function () {
        reject(new Error('FETCH_TIMEOUT'));
      }, timeoutMs);
    });
    return Promise.race([
      fetch(url, options).then(function (response) {
        clearTimeout(timeoutId);
        return response;
      }),
      timeoutPromise
    ]).then(function (response) {
      if (!response || !response.ok) throw new Error(response ? 'Overpass: ' + response.status : 'FETCH_TIMEOUT');
      return response.json();
    });
  }

  function fetchPlacesFromOverpass(lat, lng, radiusMeters) {
    var radius = Math.min(Math.round(radiusMeters), 10000);
    var q = [
      '[out:json][timeout:20];',
      '(',
      '  node(around:' + radius + ',' + lat + ',' + lng + ')[tourism=museum][name];',
      '  node(around:' + radius + ',' + lat + ',' + lng + ')[tourism=gallery][name];',
      '  node(around:' + radius + ',' + lat + ',' + lng + ')[tourism=attraction][name];',
      '  node(around:' + radius + ',' + lat + ',' + lng + ')[tourism=viewpoint][name];',
      '  node(around:' + radius + ',' + lat + ',' + lng + ')[tourism=theme_park][name];',
      '  node(around:' + radius + ',' + lat + ',' + lng + ')[tourism=zoo][name];',
      '  node(around:' + radius + ',' + lat + ',' + lng + ')[historic][name];',
      '  node(around:' + radius + ',' + lat + ',' + lng + ')[amenity=museum][name];',
      '  node(around:' + radius + ',' + lat + ',' + lng + ')[amenity=arts_centre][name];',
      '  node(around:' + radius + ',' + lat + ',' + lng + ')[amenity=theatre][name];',
      '  node(around:' + radius + ',' + lat + ',' + lng + ')[leisure=park][name];',
      '  node(around:' + radius + ',' + lat + ',' + lng + ')[leisure=nature_reserve][name];',
      ');',
      'out body;'
    ].join('');

    return fetchWithTimeout(config.OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(q)
    }, OVERPASS_FETCH_TIMEOUT_MS);
  }

  function shuffleArray(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  Sp.fetchPlacesFromOverpass = fetchPlacesFromOverpass;
  Sp.shuffleArray = shuffleArray;
})();
