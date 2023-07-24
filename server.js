/*
    Name: server.js
    Author: Gio Ciudadano
    Description:
      - Launches a server at port 8080 and fetches index.html when localhost:8080 is visited.
      - Returns a list of places with their address and associated barangay, municipality, and province based
        on the passed search text and location biases when localhost:8080/maps-autocomplete is visited.
    Launch Instructions: node server.js
*/

const axios = require('axios');
const express = require('express');
const app = express();
var bodyParser = require('body-parser');
var urlEncodedParser = bodyParser.urlencoded({ extended: false });

app.use(express.static('public'));
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/' + 'index.html');
});

app.post('/', (request, response) => {});

app.get('/maps-autocomplete', urlEncodedParser, async function (req, res) {
  var apiKey = 'AIzaSyBDZjCJVC5mbasLkCXqVPBEFE06YSI0Eco'; // Google Maps API Key. Do not share.
  var locationBias = JSON.parse('{ "lat": "12.8797", "long": "121.7740" }'); // Location bias of the search function.

  // Uses the Google Maps Autocomplete API to fetch a list of places with the passed region name and location bias.
  // Selects a place based on the passed region type and returns its placeID.
  async function getPlaceID(regionType, regionName, locationBias) {
    return axios
      .get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${regionName}&key=${apiKey}&location=${locationBias.lat},${locationBias.lng}&radius=10000`
      )
      .then(response => {
        if (response.status != '200' || !response.data) {
          res.json(
            JSON.parse(`{
              "status": ${response.status},
              "predictions": [],
              "statusText": "Unable to fetch ${regionType} results from Google API (status code ${response.status})"
          }`)
          );
          return null;
        }
        var results = response.data.predictions;
        for (result of results) {
          switch (regionType) {
            case 'Province':
              if (result.types.includes('administrative_area_level_2')) {
                return result['place_id'];
              }
            case 'Municipality':
              if (result.types.includes('locality')) {
                return result['place_id'];
              }
            case 'Barangay':
              if (
                result.types.includes('administrative_area_level_5') ||
                result.types.includes('barangay')
              ) {
                return result['place_id'];
              }
          }
        }
        return null;
      });
  }

  // Updates the location bias to the coordinates of the passed placeID.
  async function setLocationBias(placeID) {
    if (placeID == null) {
      return null;
    }
    return axios
      .get(
        `https://maps.googleapis.com/maps/api/place/details/json?fields=geometry&place_id=${placeID}&key=${apiKey}`
      )
      .then(response => {
        if (response.status != '200' || !response.data) {
          res.json(
            JSON.parse(`{
              "status": ${response.status},
              "predictions": [],
              "statusText": "Unable to fetch place location results from Google API (status code ${response.status})"
          }`)
          );
          return null;
        }
        locationBias = response.data.result.geometry.location;
        return response.data.result.geometry.location;
      });
  }

  // Fetches a list of places based on the passed search text and the calculated location bias.
  async function getPlaces(searchText, locationBias) {
    await axios
      .get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${searchText}&key=${apiKey}&location=${locationBias.lat},${locationBias.lng}&radius=10000`
      )
      .then(async response => {
        let output = await Promise.all(
          response.data.predictions.map(async result => {
            let placeID = result['place_id'];
            return axios
              .get(
                `https://maps.googleapis.com/maps/api/place/details/json?&fields=name,formatted_address,address_components&place_id=${placeID}&key=${apiKey}`
              )
              .then(response => {
                let place = response.data.result;
                let barangay = 'N/A',
                  municipality = 'N/A',
                  province = 'N/A';
                for (addressComponent of place['address_components']) {
                  if (
                    addressComponent.types.includes(
                      'administrative_area_level_2'
                    ) ||
                    (addressComponent.types.includes(
                      'administrative_area_level_1'
                    ) &&
                      province == 'N/A')
                  ) {
                    province = addressComponent.long_name;
                  } else if (addressComponent.types.includes('locality')) {
                    municipality = addressComponent.long_name;
                  } else if (
                    addressComponent.types.includes(
                      'administrative_area_level_5'
                    ) ||
                    addressComponent.types.includes('neighborhood')
                  ) {
                    barangay = addressComponent.long_name;
                  }
                }
                let placeJSON = JSON.parse(
                  `{"address": "${place.name}, ${place.formatted_address}",
                  "barangay": "${barangay}",
                  "municipality": "${municipality}",
                  "province": "${province}"}`
                );
                return placeJSON;
              });
          })
        );
        console.log('GET Request responded:');
        console.log(output);
        res.json(output);
      });
  }

  // Updates the location bias to the passed province, municipality, and barangay parameters.
  // If the name of the region is not found, the location bias of the sparser region is used.
  await setLocationBias(
    await getPlaceID('Province', req.query.province, locationBias)
  );
  await setLocationBias(
    await getPlaceID('Municipality', req.query.municipality, locationBias)
  );
  await setLocationBias(
    await getPlaceID('Barangay', req.query.barangay, locationBias)
  );

  getPlaces(req.query.searchText, locationBias);
});

const port = 8080;
app.listen(port, () => {
  console.log(`Server launched at port ${port}`);
});
