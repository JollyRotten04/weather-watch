<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import axios from 'axios'
import Chart from './components/Chart.vue'

// State for main info options
const infoOptions = ref('Precipitation')

// State for units
const temperatureUnit = ref<'C' | 'F' | 'K'>('C')
const windSpeedUnit = ref<'kt' | 'kph' | 'mph' | 'mps'>('kt')
const gustSpeedUnit = ref<'kt' | 'kph' | 'mph' | 'mps'>('kt')
const pressureUnit = ref<'bar' | 'hPa' | 'mb' | 'kt'>('bar')
const dewPointUnit = ref<'C' | 'F' | 'K' | 'PDP'>('C')


// separate arrays for each v-for
const temperatureUnits: Array<'C' | 'F' | 'K'> = ['C', 'F', 'K']
const windSpeedUnits: Array<'kt' | 'kph' | 'mph' | 'mps'> = ['kt','kph','mph','mps']
const gustSpeedUnits: Array<'kt' | 'kph' | 'mph' | 'mps'> = ['kt','kph','mph','mps']
const pressureUnits: Array<'bar' | 'hPa' | 'mb' | 'kt'> = ['bar','hPa','mb','kt']
const dewPointUnits: Array<'C' | 'F' | 'K' | 'PDP'> = ['C','F','K','PDP']

// Fetch Data...
const weather = ref<any>(null)

// To type the city interface to avoid TypeScript throwing an error, define interfaces
interface City {
  city: string
  country: string
  iso2: string
  iso3: string
  lat: string
  lng: string
  population: string
  capital: string
}

// Each daily data point
interface DailyDataPoint {
  date: string        // e.g., "2025-09-09"
  day: string         // e.g., "Tue"
  precipitation: number
  humidity: number
  uvIndex: number
  temp: number
  sunrise: string     // e.g., "08:00:57"
  sunset: string      // e.g., "19:36:59"
}

// Each hourly data point
interface HourlyDataPoint {
  date: string        // same as daily
  day: string
  time: string        // e.g., "11 AM"
  precipitation: number
  humidity: number
  uvIndex: number
  temp: number
  sunrise: string
  sunset: string
}

// Chart structure
interface Chart {
  daily: DailyDataPoint[]
  hourly: HourlyDataPoint[]
}

// Values (refs so they are reactive in template)
const location = ref('')
const selectedCity = ref('Tabaco') // Store the actual city name for API calls
const temp = ref<number|null>(null)
const dewPoint = ref<number|null>(null)
const windSpeed = ref<number|null>(null)
const windGusts = ref<number|null>(null)
const pressure = ref<number|null>(null)
const airQuality = ref<any>('N/A')
const aqiIndex = ref<number|null>(null)
const chanceOfRain = ref<number|null>(null)
const conditions = ref('')
const locations = ref<City[]>([])

// Loading state
const isLoading = ref(false)

// Chart data for different weather metrics
const chartData = ref<Chart>({
  daily: [],
  hourly: []
})

// -----------------------
// Persistence Functions
// -----------------------
const STORAGE_KEYS = {
  SELECTED_CITY: 'weather_selected_city',
  SELECTED_LOCATION: 'weather_selected_location',
  TEMPERATURE_UNIT: 'weather_temp_unit',
  WIND_SPEED_UNIT: 'weather_wind_unit',
  PRESSURE_UNIT: 'weather_pressure_unit',
  DEW_POINT_UNIT: 'weather_dew_unit'
}

// Save to localStorage
function saveToStorage(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn('Could not save to localStorage:', error)
  }
}

// Load from localStorage
function loadFromStorage(key: string, defaultValue: any = null) {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch (error) {
    console.warn('Could not load from localStorage:', error)
    return defaultValue
  }
}

// Load user preferences on app startup
function loadUserPreferences() {
  // Load city preference
  const savedCity = loadFromStorage(STORAGE_KEYS.SELECTED_CITY)
  const savedLocation = loadFromStorage(STORAGE_KEYS.SELECTED_LOCATION)
  
  if (savedCity && savedLocation) {
    selectedCity.value = savedCity
    location.value = savedLocation
  }

  // Load unit preferences
  const savedTempUnit = loadFromStorage(STORAGE_KEYS.TEMPERATURE_UNIT)
  if (savedTempUnit && ['C', 'F', 'K'].includes(savedTempUnit)) {
    temperatureUnit.value = savedTempUnit
  }

  const savedWindUnit = loadFromStorage(STORAGE_KEYS.WIND_SPEED_UNIT)
  if (savedWindUnit && ['kt', 'kph', 'mph', 'mps'].includes(savedWindUnit)) {
    windSpeedUnit.value = savedWindUnit
    gustSpeedUnit.value = savedWindUnit // Keep them in sync
  }

  const savedPressureUnit = loadFromStorage(STORAGE_KEYS.PRESSURE_UNIT)
  if (savedPressureUnit && ['bar', 'hPa', 'mb', 'kt'].includes(savedPressureUnit)) {
    pressureUnit.value = savedPressureUnit
  }

  const savedDewUnit = loadFromStorage(STORAGE_KEYS.DEW_POINT_UNIT)
  if (savedDewUnit && ['C', 'F', 'K', 'PDP'].includes(savedDewUnit)) {
    dewPointUnit.value = savedDewUnit
  }
}

// Save user preferences when they change
function saveUserPreferences() {
  saveToStorage(STORAGE_KEYS.SELECTED_CITY, selectedCity.value)
  saveToStorage(STORAGE_KEYS.SELECTED_LOCATION, location.value)
  saveToStorage(STORAGE_KEYS.TEMPERATURE_UNIT, temperatureUnit.value)
  saveToStorage(STORAGE_KEYS.WIND_SPEED_UNIT, windSpeedUnit.value)
  saveToStorage(STORAGE_KEYS.PRESSURE_UNIT, pressureUnit.value)
  saveToStorage(STORAGE_KEYS.DEW_POINT_UNIT, dewPointUnit.value)
}

// Watch for changes and save preferences
watch([selectedCity, temperatureUnit, windSpeedUnit, pressureUnit, dewPointUnit], () => {
  saveUserPreferences()
})

// -----------------------
// Helpers & Conversion functions
// -----------------------
function isNumber(v: any): v is number {
  return typeof v === 'number' && !isNaN(v)
}

function convertTemp(value: number|null, unit: string) {
  if (!isNumber(value)) return null
  if (unit === 'F') return (value * 9) / 5 + 32
  if (unit === 'K') return value + 273.15
  return value
}

function convertWind(value: number|null, unit: string) {
  if (!isNumber(value)) return null
  switch (unit) {
    case 'kt': return value / 1.852
    case 'mph': return value / 1.609344
    case 'mps': return value / 3.6
    default: return value
  }
}

function convertPressure(value: number|null, unit: string) {
  if (!isNumber(value)) return null
  switch (unit) {
    case 'bar': return value / 1000
    case 'hPa': return value
    case 'mb': return value
    default: return value
  }
}

function aqiCategory(aqi: number|null) {
  if (aqi == null) return 'N/A'
  switch (aqi) {
    case 1: return 'Good'
    case 2: return 'Fair'
    case 3: return 'Moderate'
    case 4: return 'Poor'
    case 5: return 'Very Poor'
    default: return 'N/A'
  }
}

function formatNumber(value: number|null, digits = 1) {
  if (!isNumber(value)) return '--'
  return value.toFixed(digits)
}

// -----------------------
// Chart data preparation
// -----------------------
function prepareChartData() {
  if (!weather.value || !weather.value.weather || !weather.value.weather.days) {
    return { daily: [], hourly: [] }
  }

  const days = weather.value.weather.days.slice(0, 7)

  const daily = days.map((day: any) => {
    const date = new Date(day.datetimeEpoch * 1000)
    return {
      date: day.datetime,
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      precipitation: day.precip,
      humidity: day.humidity,
      uvIndex: day.uvindex,
      temp: day.temp,
      sunrise: day.sunrise,
      sunset: day.sunset
    }
  })

  const hourly = days.flatMap((day: any) => {
    return (day.hours || []).map((hour: any) => {
      const date = new Date(hour.datetimeEpoch * 1000)
      return {
        date: day.datetime,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        time: date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
        precipitation: hour.precip,
        humidity: hour.humidity,
        uvIndex: hour.uvindex,
        temp: hour.temp,
        sunrise: day.sunrise,
        sunset: day.sunset
      }
    })
  })

  return { daily, hourly }
}

// -----------------------
// Computed values (display)
// -----------------------
const displayTemp = computed(() => {
  const v = convertTemp(temp.value, temperatureUnit.value)
  return isNumber(v) ? formatNumber(v, 1) : '--'
})

const displayDewPoint = computed(() => {
  if (dewPointUnit.value === 'PDP') {
    if (!isNumber(temp.value) || !isNumber(dewPoint.value)) return '--'
    const tConverted = convertTemp(temp.value, temperatureUnit.value) as number
    const dConverted = convertTemp(dewPoint.value, temperatureUnit.value) as number
    const pd = tConverted - dConverted
    return formatNumber(pd, 1)
  } else {
    const v = convertTemp(dewPoint.value, dewPointUnit.value)
    return isNumber(v) ? formatNumber(v, 1) : '--'
  }
})

const displayWindSpeed = computed(() => {
  const v = convertWind(windSpeed.value, windSpeedUnit.value)
  return isNumber(v) ? formatNumber(v, 1) : '--'
})

const displayWindGusts = computed(() => {
  const v = convertWind(windGusts.value, gustSpeedUnit.value)
  return isNumber(v) ? formatNumber(v, 1) : '--'
})

const displayPressure = computed(() => {
  const v = convertPressure(pressure.value, pressureUnit.value)
  return isNumber(v) ? formatNumber(v, 2) : '--'
})

const displayChanceOfRain = computed(() => {
  return isNumber(chanceOfRain.value) ? `${Math.round(chanceOfRain.value)}` : '--'
})

const displayAQI = computed(() => {
  const cat = aqiCategory(aqiIndex.value)
  const idx = isNumber(aqiIndex.value) ? aqiIndex.value : '--'
  const pm = isNumber(airQuality.value) ? `${formatNumber(airQuality.value, 1)} µg/m³` : 'N/A'
  return `${cat} (${idx}) — ${pm}`
})

// Unit labels
const tempUnitLabel = computed(() => (temperatureUnit.value === 'C' ? '℃' : temperatureUnit.value === 'F' ? '℉' : 'K'))
const dewUnitLabel = computed(() => (dewPointUnit.value === 'PDP' ? '' : dewPointUnit.value === 'C' ? '℃' : dewPointUnit.value === 'F' ? '℉' : 'K'))
const windUnitLabel = computed(() => windSpeedUnit.value)
const gustUnitLabel = computed(() => gustSpeedUnit.value)
const pressureUnitLabel = computed(() => pressureUnit.value)

const computedChartData = computed(() => {
  return prepareChartData()
})

// -----------------------
// Info option change handler
// -----------------------
function handleInfoOptionChange(option: string) {
  infoOptions.value = option
}

// -----------------------
// Fetch data - Enhanced with persistence
// -----------------------
async function fetchWeather(city: string = selectedCity.value) {
  try {
    isLoading.value = true
    
    const response = await axios.get(`https://weather-watch-n8jw.onrender.com/weather/${encodeURIComponent(city)}`)
    weather.value = response.data

    const vc = weather.value.weather

    if (!vc || !vc.days || !vc.days[0]) {
      console.error('Visual Crossing data missing days[]')
      return
    }
    const today = vc.days[0]

    // Update both the display location and the selected city
    location.value = vc.resolvedAddress ?? city
    selectedCity.value = city
    
    temp.value = isNumber(today.temp) ? today.temp : null
    dewPoint.value = isNumber(today.dew) ? today.dew : null
    windSpeed.value = isNumber(today.windspeed) ? today.windspeed : null
    windGusts.value = isNumber(today.windgust) ? today.windgust : null
    pressure.value = isNumber(today.pressure) ? today.pressure : null
    chanceOfRain.value = isNumber(today.precipprob) ? today.precipprob : null
    conditions.value = today.conditions ?? ''

    const aqiData = weather.value.airQuality?.list?.[0]
    if (aqiData) {
      aqiIndex.value = isNumber(aqiData.main?.aqi) ? aqiData.main.aqi : null
      airQuality.value = isNumber(aqiData.components?.pm2_5) ? aqiData.components.pm2_5 : 'N/A'
    } else {
      aqiIndex.value = null
      airQuality.value = 'N/A'
    }

    chartData.value = prepareChartData()

    saveUserPreferences()


    const tz = vc.timezone ?? 'UTC'
    if (intervalId) clearInterval(intervalId)
    updateDateTime(tz)
    intervalId = window.setInterval(() => updateDateTime(tz), 1000)
    
  } catch (error) {
    console.error(`Error fetching weather for ${city}:`, error)
  } finally {
    isLoading.value = false
  }
}

// -----------------------
// Fetch all locations
// -----------------------
async function fetchLocations() {
  try {
    const response = await axios.get('https://weather-watch-n8jw.onrender.com/cities')
    const data = response.data

    if (!data || !Array.isArray(data)) {
      console.error('Locations response missing or invalid')
      locations.value = []
      return
    }

    locations.value = data
  } catch (error) {
    console.error('Error fetching locations:', error)
    locations.value = []
  }
}

// -----------------------
// Time and Date (timezone-aware)
// -----------------------
const currentTime = ref('')
const currentDate = ref('')
let intervalId: number

function updateDateTime(timezone: string) {
  const now = new Date()

  currentTime.value = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: timezone,
  })

  currentDate.value = now.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    timeZone: timezone,
  })
}

// -----------------------
// Dropdown state
// -----------------------
const showDropdown = ref(false)
const searchQuery = ref('')

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
  if (!showDropdown.value) {
    searchQuery.value = ''
  }
}

function closeDropdown() {
  showDropdown.value = false
  searchQuery.value = ''
}

const filteredLocations = computed(() => {
  if (!searchQuery.value) return locations.value.slice(0, 20)
  return locations.value.filter(loc =>
    loc.city.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    loc.country.toLowerCase().includes(searchQuery.value.toLowerCase())
  ).slice(0, 20)
})

// Enhanced selectLocation function with persistence
async function selectLocation(loc: any) {
  console.log('Selected location:', loc)
  
  showDropdown.value = false
  searchQuery.value = ''
  
  // Update both display and storage values
  const displayLocation = `${loc.city}, ${loc.country}`
  location.value = displayLocation
  selectedCity.value = loc.city
  
  // Save immediately and then fetch
  saveUserPreferences()
  await fetchWeather(loc.city)
}

onMounted(async () => {
  // Load user preferences first
  loadUserPreferences()
  
  await fetchLocations()
  
  // Use the saved city or default to Tabaco
  await fetchWeather(selectedCity.value)
})

onUnmounted(() => {
  clearInterval(intervalId)
})
</script>

<!-- The template remains exactly the same as your original -->
<template>
  <div class="min-h-screen w-full relative">

    <!-- Background image -->
    <img src="./assets/background.svg" draggable="false" class="object-cover select-none min-h-full w-full absolute inset-0 z-1" />

    <!-- Main Container -->
    <div class="relative z-5 w-full md:w-4/5 lg:w-3/5 xl:w-[50rem] p-4 flex flex-col justify-center mx-auto min-h-screen">

      <!-- Content Container -->
      <div class="relative w-full z-10 lg:rounded-2xl">

        <!-- Transparent Effect -->
        <div class="absolute z-15 left-0 top-0 h-full w-full opacity-50 bg-gray-200 rounded-xl"></div>

        <!-- Content -->
        <div class="relative z-20 w-full p-4 lg:p-6 xl:p-8 flex flex-col gap-8">

         <!-- Basic Info -->
<div class="flex flex-col relative">
  <!-- Location trigger with loading indicator -->
  <div class="relative">
    <p 
      class="text-black text-3xl xl:text-5xl font-sans font-normal text-center cursor-pointer hover:text-blue-600 transition-colors duration-200"
      :class="{ 'opacity-50': isLoading }"
      @click="toggleDropdown"
    >
      {{ location || 'Loading...' }}
    </p>
    
    <!-- Loading spinner -->
    <div 
      v-if="isLoading" 
      class="absolute top-1/2 right-4 transform -translate-y-1/2"
    >
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
    </div>
  </div>

  <!-- Dropdown Modal -->
  <div 
    v-if="showDropdown" 
    class="absolute top-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 w-72 left-1/2 transform -translate-x-1/2 max-h-80 overflow-y-auto"
    @click.stop
  >
    <!-- Searchbar -->
    <div class="p-3 border-b border-gray-200 sticky top-0 bg-white">
      <input 
        type="text" 
        v-model="searchQuery"
        placeholder="Search city or country..."
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
        @keydown.escape="closeDropdown"
      />
    </div>

    <!-- City list -->
    <ul class="max-h-60 overflow-y-auto">
      <li 
        v-for="loc in filteredLocations" 
        :key="`${loc.city}-${loc.country}`" 
        @click="selectLocation(loc)"
        class="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors duration-150 flex justify-between items-center"
      >
        <div>
          <div class="font-medium text-gray-900">{{ loc.city }}</div>
          <div class="text-sm text-gray-500">{{ loc.country }}</div>
        </div>
      </li>
      
      <!-- No results message -->
      <li 
        v-if="filteredLocations.length === 0 && searchQuery" 
        class="px-4 py-3 text-gray-500 text-center"
      >
        No cities found
      </li>
      
      <!-- Loading message -->
      <li 
        v-if="filteredLocations.length === 0 && !searchQuery && locations.length === 0" 
        class="px-4 py-3 text-gray-500 text-center"
      >
        Loading cities...
      </li>
    </ul>
  </div>

  <!-- Overlay to close dropdown when clicking outside -->
  <div 
    v-if="showDropdown" 
    class="fixed inset-0 z-40" 
    @click="closeDropdown"
  ></div>

  <!-- Time & Date -->
  <p class="text-black text-xl xl:text-3xl font-sans font-light text-center">{{ currentTime }}</p>
  <p class="text-black text-base xl:text-xl font-sans font-light text-center">{{ currentDate }}</p>
</div>

          <!-- Info Container -->
          <div class="flex flex-col gap-4 overflow-x-hidden w-full">

            <!-- Top Container -->
            <div class="flex flex-col gap-4 w-full">

              <!-- Info Buttons (Portrait) -->
              <div class="flex flex-col gap-4 landscape:hidden">
                <div class="flex justify-center gap-4">
                  <TransitionGroup name="fade-scale" tag="div" class="flex [@media(max-width:390px)]:flex-col gap-4 w-full">
                    <div
                      v-for="option in ['Precipitation','Humidity','UV Index','Day Temperature','Sunrise & Sunset']"
                      :key="option"
                      @click="handleInfoOptionChange(option)"
                      class="p-3 h-12 flex items-center justify-center flex-col rounded-lg cursor-pointer transition-all duration-300 ease-in-out w-full"
                      :class="infoOptions === option 
                        ? 'bg-[#4A67FF] text-white scale-105 shadow-lg' 
                        : 'bg-white opacity-60 text-black hover:scale-105 hover:shadow-md'"
                    >
                      <p class="text-[0.45rem] sm:portrait:text-[0.5rem] md:text-base lg:text-base xl:text-base text-center font-semibold">{{ option }}</p>
                    </div>
                  </TransitionGroup>
                </div>
              </div>

              <!-- Landscape Info + Chart -->
              <div class="flex w-full gap-4">

                <!-- Real Feel Temperature + Buttons Landscape -->
                <div class="flex flex-col justify-center gap-2 portrait:hidden">
                  <div class="bg-gray-300 p-4 rounded-tl-xl rounded-tr-xl shadow-xl w-32 flex flex-col items-center">
                    <p class="text-black font-light text-xs text-center">Friday</p>
                    <p class="text-black font-normal text-2xl xl:text-3xl text-center">
                      {{ displayTemp }}{{ tempUnitLabel }}
                    </p>
                    <p class="text-black font-normal text-[0.45rem] lg:text-[0.6rem] text-center">Real Feel Temperature</p>
                  </div>

                  <div class="flex gap-2 w-full">
                    <TransitionGroup name="fade-scale" tag="div" class="flex gap-2 w-full">
                      <button
                        v-for="unit in temperatureUnits"
                        :key="unit"
                        @click="temperatureUnit = unit"
                        class="text-sm font-extralight p-1 px-1.5 w-full cursor-pointer transition-all duration-300 ease-in-out"
                        :class="[
                          temperatureUnit === unit
                            ? 'bg-[#E3A789] text-gray-200 scale-105 shadow-md'
                            : 'bg-gray-300 text-black hover:scale-105 hover:shadow-sm',
                          unit === 'C' ? 'rounded-bl-xl' : unit === 'K' ? 'rounded-br-xl' : ''
                        ]"
                      >{{ unit === 'C' ? '℃' : unit === 'F' ? '℉' : 'K' }}</button>
                    </TransitionGroup>
                  </div>
                </div>

                <!-- Chart and Buttons Styling for Landscape -->
                <div class="flex flex-col gap-4 flex-1 min-w-0">

                  <!-- Info Buttons (Landscape) -->
                  <div class="flex flex-col gap-4 w-full portrait:hidden">
                    <div class="flex justify-center gap-4 w-full">
                      <TransitionGroup name="fade-scale" tag="div" class="flex gap-4 w-full">
                        <div
                          v-for="option in ['Precipitation','Humidity','UV Index','Day Temperature']"
                          :key="option"
                          @click="handleInfoOptionChange(option)"
                          class="p-3 h-12 flex items-center justify-center flex-col rounded-lg cursor-pointer transition-all duration-300 ease-in-out w-full"
                          :class="infoOptions === option 
                            ? 'bg-[#4A67FF] text-white scale-105 shadow-lg' 
                            : 'bg-white opacity-60 text-black hover:scale-105 hover:shadow-md'"
                        >
                          <p class="text-[0.5rem] sm:text-[0.5rem] xl:text-xs text-center font-semibold">{{ option }}</p>
                        </div>
                      </TransitionGroup>
                    </div>
                  </div>

                  <!-- Chart -->
                  <div class="p-2 bg-gray-300 h-48 landscape:h-32 lg:landscape:h-40 xl:landscape:h-48 rounded-xl overflow-hidden">
                    <Chart 
                      :data="computedChartData" 
                      :dataType="infoOptions"
                      :key="infoOptions + temperatureUnit"
                      :isLoading="isLoading"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Other Info Container -->
            <div class="flex flex-col gap-4 w-full items-center">

              <!-- Real Feel Temperature + Buttons Portrait -->
              <div class="flex flex-col gap-2 landscape:hidden">
                <div class="bg-gray-300 p-4 rounded-tl-xl rounded-tr-xl shadow-xl w-32 flex flex-col items-center">
                  <p class="text-black font-light text-xs sm:text-sm text-center">Friday</p>
                  <p class="text-black font-normal text-2xl sm:text-3xl text-center">
                    {{ displayTemp }}{{ tempUnitLabel }}
                  </p>
                  <p class="text-black font-normal text-[0.45rem] sm:text-[0.55rem] text-center">Real Feel Temperature</p>
                </div>

                <div class="flex gap-2 w-full">
                  <TransitionGroup name="fade-scale" tag="div" class="flex gap-2 w-full">
                    <button
                      v-for="unit in temperatureUnits"
                      :key="unit"
                      @click="temperatureUnit = unit"
                      class="text-sm sm:text-base font-extralight p-1 px-1.5 w-full cursor-pointer transition-all duration-300 ease-in-out"
                      :class="[
                        temperatureUnit === unit
                          ? 'bg-[#E3A789] text-gray-200 scale-105 shadow-md'
                          : 'bg-gray-300 text-black hover:scale-105 hover:shadow-sm',
                        unit === 'C' ? 'rounded-bl-xl' : unit === 'K' ? 'rounded-br-xl' : ''
                      ]"
                    >{{ unit === 'C' ? '℃' : unit === 'F' ? '℉' : 'K' }}</button>
                  </TransitionGroup>
                </div>
              </div>

              <!-- Grid Content Main Container -->
              <div class="inline-grid landscape:w-full grid-cols-2 landscape:grid-cols-3 portrait:md:grid-cols-3 sm:grid-cols-3 gap-4 justify-center [@media(max-width:350px)]:grid-cols-1">

                <!-- Wind Speed -->
                <div class="flex flex-col gap-2 items-center">
                  <div class="flex gap-2 w-full">
                    <TransitionGroup name="fade-scale" tag="div" class="flex gap-2 w-full">
                      <button
                        v-for="unit in windSpeedUnits"
                        :key="unit"
                        @click="windSpeedUnit = unit"
                        class="text-[0.6rem] sm:text-base font-extralight p-1 px-1.5 w-full cursor-pointer transition-all duration-300 ease-in-out"
                        :class="[
                          windSpeedUnit === unit
                            ? 'bg-[#E3A789] text-gray-200 scale-105 shadow-md'
                            : 'bg-gray-300 text-black hover:scale-105 hover:shadow-sm',
                          unit === 'kt' ? 'rounded-tl-xl' : unit === 'mps' ? 'rounded-tr-xl' : ''
                        ]"
                      >{{ unit }}</button>
                    </TransitionGroup>
                  </div>
                  <div class="bg-gray-300 h-28 w-full p-4 rounded-b-xl shadow-xl flex flex-col justify-center items-center">
                    <p class="text-black font-normal text-2xl sm:text-3xl text-center">{{ displayWindSpeed }} {{ windUnitLabel }}</p>
                    <p class="text-black font-normal text-[0.45rem] sm:text-[0.65rem] text-center">Wind Speed</p>
                  </div>
                </div>

                <!-- Gust Speed -->
                <div class="flex flex-col gap-2 items-center">
                  <div class="flex gap-2 w-full">
                    <TransitionGroup name="fade-scale" tag="div" class="flex gap-2 w-full">
                      <button
                        v-for="unit in gustSpeedUnits"
                        :key="unit"
                        @click="gustSpeedUnit = unit"
                        class="text-[0.55rem] sm:text-base font-extralight p-1 px-1.5 w-full cursor-pointer transition-all duration-300 ease-in-out"
                        :class="[
                          gustSpeedUnit === unit
                            ? 'bg-[#E3A789] text-gray-200 scale-105 shadow-md'
                            : 'bg-gray-300 text-black hover:scale-105 hover:shadow-sm',
                          unit === 'kt' ? 'rounded-tl-xl' : unit === 'mps' ? 'rounded-tr-xl' : ''
                        ]"
                      >{{ unit }}</button>
                    </TransitionGroup>
                  </div>
                  <div class="bg-gray-300 h-28 w-full p-4 rounded-b-xl shadow-xl flex flex-col justify-center items-center">
                    <p class="text-black font-normal text-2xl sm:text-3xl text-center">{{ displayWindGusts }} {{ gustUnitLabel }}</p>
                    <p class="text-black font-normal text-[0.45rem] sm:text-[0.65rem] text-center">Gust Speed</p>
                  </div>
                </div>

                <!-- Atmospheric Pressure -->
                <div class="flex flex-col gap-2 items-center">
                  <div class="flex gap-2 w-full">
                    <TransitionGroup name="fade-scale" tag="div" class="flex gap-2 w-full">
                      <button
                        v-for="unit in pressureUnits"
                        :key="unit"
                        @click="pressureUnit = unit"
                        class="text-[0.6rem] sm:text-base font-extralight p-1 px-1.5 w-full cursor-pointer transition-all duration-300 ease-in-out"
                        :class="[
                          pressureUnit === unit
                            ? 'bg-[#E3A789] text-gray-200 scale-105 shadow-md'
                            : 'bg-gray-300 text-black hover:scale-105 hover:shadow-sm',
                          unit === 'bar' ? 'rounded-tl-xl' : unit === 'kt' ? 'rounded-tr-xl' : ''
                        ]"
                      >{{ unit }}</button>
                    </TransitionGroup>
                  </div>
                  <div class="bg-gray-300 h-28 w-full p-4 rounded-b-xl shadow-xl flex flex-col justify-center items-center">
                    <p class="text-black font-normal text-2xl sm:text-3xl text-center">{{ displayPressure }} {{ pressureUnitLabel }}</p>
                    <p class="text-black font-normal text-[0.45rem] sm:text-[0.65rem] text-center">Atmospheric Pressure</p>
                  </div>
                </div>

                <!-- Dew Point Temperature -->
                <div class="flex flex-col gap-2 items-center">
                  <div class="flex gap-2 w-full">
                    <TransitionGroup name="fade-scale" tag="div" class="flex gap-2 w-full">
                      <button
                        v-for="unit in dewPointUnits"
                        :key="unit"
                        @click="dewPointUnit = unit"
                        class="text-[0.6rem] sm:text-base font-extralight p-1 px-1.5 w-full cursor-pointer transition-all duration-300 ease-in-out"
                        :class="[
                          dewPointUnit === unit
                            ? 'bg-[#E3A789] text-gray-200 scale-105 shadow-md'
                            : 'bg-gray-300 text-black hover:scale-105 hover:shadow-sm',
                          unit === 'C' ? 'rounded-tl-xl' : unit === 'PDP' ? 'rounded-tr-xl' : ''
                        ]"
                      >{{ unit === 'C' ? '℃' : unit === 'F' ? '℉' : unit }}</button>
                    </TransitionGroup>
                  </div>
                  <div class="bg-gray-300 h-28 w-full p-4 rounded-b-xl shadow-xl flex flex-col justify-center items-center">
                    <p class="text-black font-normal text-2xl sm:text-3xl text-center">
                      <!-- If PDP selected, show "X °<tempUnitLabel> below" -->
                      <template v-if="dewPointUnit === 'PDP'">
                        {{ displayDewPoint }} {{ tempUnitLabel }} (depression)
                      </template>
                      <template v-else>
                        {{ displayDewPoint }}{{ dewUnitLabel }}
                      </template>
                    </p>
                    <p class="text-black font-normal text-[0.45rem] sm:text-[0.65rem] text-center">Dew Point Temperature</p>
                  </div>
                </div>

                <!-- Air Quality -->
                <div class="flex flex-col gap-2 items-center">
                  <div class="bg-gray-300 h-32 landscape:h-full md:h-full sm:h-full w-full p-4 rounded-xl shadow-xl flex flex-col justify-center items-center">
                    <p class="text-black font-normal text-2xl sm:text-3xl text-center">{{ displayAQI }}</p>
                    <p class="text-black font-normal text-[0.45rem] sm:text-[0.65rem] text-center">Air Quality</p>
                  </div>
                </div>

                <!-- Chance of Rain -->
                <div class="flex flex-col gap-2 items-center">
                  <div class="bg-gray-300 h-32 landscape:h-full md:h-full sm:h-full w-full p-4 rounded-xl shadow-xl flex flex-col justify-center items-center">
                    <p class="text-black font-normal text-2xl sm:text-3xl text-center">{{ displayChanceOfRain }}%</p>
                    <p class="text-black font-normal text-[0.45rem] sm:text-[0.65rem] text-center">Chance of Rain</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.3s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
.fade-scale-enter-to,
.fade-scale-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>