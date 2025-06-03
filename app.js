const cityInput = document.getElementById('cityInput');
const suggestionsBox = document.getElementById('suggestionsBox');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const errorMsg = document.getElementById('errorMsg');
const currentWeather = document.getElementById('currentWeather');
const forecastGrid = document.getElementById('forecast');
const forecastTitle = document.getElementById('forecastTitle');
const recentCities = document.getElementById('recentCities');

const apiKey = 'dd96477dcbc3bf90690ccace94cb61ba'; 
let debounceTimer;

// --------- Autocomplete
cityInput.addEventListener('input', () => {
  const query = cityInput.value.trim();
  if (debounceTimer) clearTimeout(debounceTimer);

  if (query.length >= 3) {
    debounceTimer = setTimeout(() => fetchCitySuggestions(query), 300);
  } else {
    suggestionsBox.classList.add('hidden');
  }
});

function fetchCitySuggestions(query) {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${apiKey}`;
  fetch(url)
    .then(res => res.json())
    .then(data => renderSuggestions(data))
    .catch(() => suggestionsBox.classList.add('hidden'));
}

// -------Suggestions*

function renderSuggestions(data) {
  suggestionsBox.innerHTML = '';
  if (data.length === 0) {
    suggestionsBox.classList.add('hidden');
    return;
  }

  data.forEach(city => {
    const div = document.createElement('div');
    div.classList.add('suggestion-item');
    div.textContent = `${city.name}${city.state ? ', ' + city.state : ''}, ${city.country}`;

    div.addEventListener('click', () => {
      cityInput.value = div.textContent;
      suggestionsBox.classList.add('hidden');
      searchBtn.click();
    });

    suggestionsBox.appendChild(div);
  });

  suggestionsBox.classList.remove('hidden');
}

document.addEventListener('click', (e) => {
  if (!cityInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
    suggestionsBox.classList.add('hidden');
  }
});

// --------- Fetch Weather
searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (!city) {
    errorMsg.textContent = 'Please enter a city.';
    return;
  }
  errorMsg.textContent = '';
  getCoordinates(city);
});

locationBtn.addEventListener('click', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      fetchWeather(pos.coords.latitude, pos.coords.longitude);
    }, () => {
      errorMsg.textContent = 'Could not get location.';
    });
  }
});

function getCoordinates(city) {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`;
  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data.length === 0) throw new Error();
      const { lat, lon } = data[0];
      addRecentCity(city);
      fetchWeather(lat, lon);
    })
    .catch(() => {
      errorMsg.textContent = 'City not found.';
    });
}

function fetchWeather(lat, lon) {
  const currentURL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  Promise.all([fetch(currentURL), fetch(forecastURL)])
    .then(responses => Promise.all(responses.map(res => res.json())))
    .then(([current, forecast]) => {
      displayCurrent(current);
      displayForecast(forecast.list);
    })
    .catch(() => {
      errorMsg.textContent = 'Weather fetch failed.';
    });
}

function displayCurrent(data) {
  const html = `
    <h2 class="text-xl font-bold mb-2">${data.name}, ${data.sys.country}</h2>
    <p><strong>Weather:</strong> ${data.weather[0].main} 🌤️</p>
    <p><strong>Temp:</strong> ${data.main.temp}°C</p>
    <p><strong>Humidity:</strong> ${data.main.humidity}%</p>
    <p><strong>Wind:</strong> ${data.wind.speed} m/s</p>
  `;
  currentWeather.innerHTML = html;
  currentWeather.classList.remove('hidden');
}

function displayForecast(list) {
  const daily = list.filter(item => item.dt_txt.includes('12:00:00')).slice(0, 5);
  forecastGrid.innerHTML = '';
  daily.forEach(day => {
    const html = `
      <div>
        <p><strong>${new Date(day.dt_txt).toLocaleDateString()}</strong></p>
        <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="${day.weather[0].description}" class="mx-auto w-12" />
        <p>${day.weather[0].main}</p>
        <p>${day.main.temp}°C</p>
        <p>💧 ${day.main.humidity}%</p>
        <p>💨 ${day.wind.speed} m/s</p>
      </div>
    `;
    forecastGrid.innerHTML += html;
  });
  forecastTitle.classList.remove('hidden');
  forecastGrid.classList.remove('hidden');
}

// --------- Recent Cities
function addRecentCity(city) {
  let cities = JSON.parse(localStorage.getItem('recentCities')) || [];
  cities = [city, ...cities.filter(c => c !== city)].slice(0, 5);
  localStorage.setItem('recentCities', JSON.stringify(cities));
  renderRecentCities();
}

function renderRecentCities() {
  const cities = JSON.parse(localStorage.getItem('recentCities')) || [];
  recentCities.innerHTML = '';
  if (cities.length === 0) {
    recentCities.classList.add('hidden');
    return;
  }
  cities.forEach(city => {
    const opt = document.createElement('option');
    opt.textContent = city;
    recentCities.appendChild(opt);
  });
  recentCities.classList.remove('hidden');
}

recentCities.addEventListener('change', () => {
  cityInput.value = recentCities.value;
  searchBtn.click();
});

renderRecentCities();
