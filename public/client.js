const form = document.getElementById('input');

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

document.addEventListener('submit', event => {
  event.preventDefault();
  submitToAPI();
});
