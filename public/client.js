/*
    Name: client.js
    Author: Gio Ciudadano
    Description:
      - Launches a server at port 8080 and fetches index.html when localhost:8080 is visited.
      - Returns a list of places with their address and associated barangay, municipality, and province based
        on the passed search text and location biases when localhost:8080/maps-autocomplete is visited.
    Launch Instructions: see server.js
*/

const form = document.getElementById('input');

// Fetches the textbox values in index.html and sends a GET request to server.js.
// Prints the GET response to the textarea.
function submitToAPI() {
  const searchText = document.getElementById('searchText').value;
  const province = document.getElementById('province').value;
  const municipality = document.getElementById('municipality').value;
  const barangay = document.getElementById('barangay').value;

  axios
    .get('//localhost:8080/maps-autocomplete', {
      params: {
        searchText,
        province,
        municipality,
        barangay
      },
      headers: {
        'content-type': 'text/json'
      }
    })
    .then(response => {
      output.innerHTML = JSON.stringify(response.data);
    });
}

// Adds an event listener for form submits. Calls submitToAPI() on trigger.
document.addEventListener('submit', event => {
  event.preventDefault();
  submitToAPI();
});
