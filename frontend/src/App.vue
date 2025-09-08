<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import axios from 'axios'
import Chart from './components/Chart.vue'

// State for main info options
const infoOptions = ref('Precipitation')

// State for units
const temperatureUnit = ref<'C' | 'F' | 'K'>('C')
const windSpeedUnit = ref<'kt' | 'kph' | 'mph' | 'mps'>('kt')
const gustSpeedUnit = ref<'kt' | 'kph' | 'mph' | 'mps'>('kt')
const pressureUnit = ref<'bar' | 'hPa' | 'mb' | 'kt'>('bar') // 'kt' present in UI; handled as hPa fallback
const dewPointUnit = ref<'C' | 'F' | 'K' | 'PDP'>('C') // PDP = dew point depression

// Fetch Data...
const weather = ref<any>(null)

// Values (refs so they are reactive in template)
const location = ref('')
const temp = ref<number|null>(null) // Visual Crossing provides temp in °C
const dewPoint = ref<number|null>(null) // °C
const windSpeed = ref<number|null>(null) // km/h (Visual Crossing uses km/h)
const windGusts = ref<number|null>(null) // km/h
const pressure = ref<number|null>(null) // mb / hPa (Visual Crossing uses mb/hPa)
const airQuality = ref<any>('N/A') // PM2.5 µg/m³
const aqiIndex = ref<number|null>(null) // OpenWeatherMap AQI index (1–5)
const chanceOfRain = ref<number|null>(null)
const conditions = ref('')
const precipitation = ref('')

// Chart data for different weather metrics
const chartData = ref<any[]>([])

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
  return value // Celsius
}

/**
 * convertWind:
 *  - input assumed km/h (Visual Crossing)
 *  - returns number in desired unit
 */
function convertWind(value: number|null, unit: string) {
  if (!isNumber(value)) return null
  switch (unit) {
    case 'kt': return value / 1.852 // km/h -> knots
    case 'mph': return value / 1.609344 // km/h -> mph
    case 'mps': return value / 3.6 // km/h -> m/s
    default: return value // 'kph' -> km/h
  }
}

/**
 * convertPressure:
 *  - input assumed hPa / mb (Visual Crossing)
 *  - returns number in desired unit
 */
function convertPressure(value: number|null, unit: string) {
  if (!isNumber(value)) return null
  switch (unit) {
    case 'bar': return value / 1000 // hPa -> bar
    case 'hPa': return value // already hPa
    case 'mb': return value // same as hPa
    // handle stray 'kt' option in UI by returning hPa
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

  const days = weather.value.weather.days.slice(0, 7) // limit to a week

  // --- DAILY DATA ---
  const daily = days.map((day: any) => {
    const date = new Date(day.datetimeEpoch * 1000)
    return {
      date: day.datetime,
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),

      // Requested values
      precipitation: day.precip,
      humidity: day.humidity,
      uvIndex: day.uvindex,
      temp: day.temp,               // average day temp
      sunrise: day.sunrise,         // e.g. "06:15:00"
      sunset: day.sunset            // e.g. "18:23:00"
    }
  })

  // --- HOURLY DATA ---
  const hourly = days.flatMap((day: any) => {
    return (day.hours || []).map((hour: any) => {
      const date = new Date(hour.datetimeEpoch * 1000)
      return {
        date: day.datetime,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        time: date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),

        // Requested values
        precipitation: hour.precip,
        humidity: hour.humidity,
        uvIndex: hour.uvindex,
        temp: hour.temp,

        // No hourly sunrise/sunset → attach the daily ones
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
// Temperature (display according to temperatureUnit)
const displayTemp = computed(() => {
  const v = convertTemp(temp.value, temperatureUnit.value)
  return isNumber(v) ? formatNumber(v, 1) : '--'
})

// Dew point: handles PDP (dew point depression) when dewPointUnit === 'PDP'
const displayDewPoint = computed(() => {
  if (dewPointUnit.value === 'PDP') {
    // compute (temp - dewPoint) but convert both to the selected temperature unit for display
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

// Wind speed & gusts
const displayWindSpeed = computed(() => {
  const v = convertWind(windSpeed.value, windSpeedUnit.value)
  return isNumber(v) ? formatNumber(v, 1) : '--'
})
const displayWindGusts = computed(() => {
  const v = convertWind(windGusts.value, gustSpeedUnit.value)
  return isNumber(v) ? formatNumber(v, 1) : '--'
})

// Pressure
const displayPressure = computed(() => {
  const v = convertPressure(pressure.value, pressureUnit.value)
  return isNumber(v) ? formatNumber(v, 2) : '--'
})

// Chance of rain
const displayChanceOfRain = computed(() => {
  return isNumber(chanceOfRain.value) ? `${Math.round(chanceOfRain.value)}` : '--'
})

// AQI display: category + index + pm2.5
const displayAQI = computed(() => {
  const cat = aqiCategory(aqiIndex.value)
  const idx = isNumber(aqiIndex.value) ? aqiIndex.value : '--'
  const pm = isNumber(airQuality.value) ? `${formatNumber(airQuality.value, 1)} µg/m³` : 'N/A'
  return `${cat} (${idx}) — ${pm}`
})

// Unit labels/helpers for template
const tempUnitLabel = computed(() => (temperatureUnit.value === 'C' ? '℃' : temperatureUnit.value === 'F' ? '℉' : 'K'))
const dewUnitLabel = computed(() => (dewPointUnit.value === 'PDP' ? '' : dewPointUnit.value === 'C' ? '℃' : dewPointUnit.value === 'F' ? '℉' : 'K'))
const windUnitLabel = computed(() => windSpeedUnit.value)
const gustUnitLabel = computed(() => gustSpeedUnit.value)
const pressureUnitLabel = computed(() => pressureUnit.value)

// Computed chart data that updates when infoOptions or temperatureUnit changes
const computedChartData = computed(() => {
  return prepareChartData(infoOptions.value)
})

// -----------------------
// Info option change handler
// -----------------------
function handleInfoOptionChange(option: string) {
  infoOptions.value = option
  // chartData will be automatically updated via computed property
}

// -----------------------
// Fetch data
// -----------------------
async function fetchWeather() {
  try {
    const response = await axios.get('http://localhost:3000/weather/Tabaco')
    weather.value = response.data

    // Visual Crossing part
    const vc = weather.value.weather
    // guard
    if (!vc || !vc.days || !vc.days[0]) {
      console.error('Visual Crossing data missing days[]')
      return
    }
    const today = vc.days[0]

    location.value = vc.resolvedAddress ?? 'Unknown'
    temp.value = isNumber(today.temp) ? today.temp : null
    dewPoint.value = isNumber(today.dew) ? today.dew : null
    windSpeed.value = isNumber(today.windspeed) ? today.windspeed : null
    windGusts.value = isNumber(today.windgust) ? today.windgust : null
    pressure.value = isNumber(today.pressure) ? today.pressure : null
    chanceOfRain.value = isNumber(today.precipprob) ? today.precipprob : null
    conditions.value = today.conditions ?? ''

    // OpenWeatherMap Air Quality
    const aqiData = weather.value.airQuality?.list?.[0]
    if (aqiData) {
      aqiIndex.value = isNumber(aqiData.main?.aqi) ? aqiData.main.aqi : null
      airQuality.value = isNumber(aqiData.components?.pm2_5) ? aqiData.components.pm2_5 : 'N/A'
    } else {
      aqiIndex.value = null
      airQuality.value = 'N/A'
    }

    // Prepare initial chart data
    chartData.value = prepareChartData(infoOptions.value)

    // optional: debug
    console.log('Weather data loaded:', weather.value)
    console.log('Chart data prepared:', chartData.value)
  } catch (error) {
    console.error('Error fetching weather:', error)
  }
}

// Time and Date (reactive)
const currentTime = ref('')
const currentDate = ref('')

// Get current time and date
function getDateTime() {
  const now = new Date()

  // Time in 12-hour format with seconds
  const time12hr = now.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })

  // Date in mm/dd/yyyy
  const mm = String(now.getMonth() + 1).padStart(2, '0') // months are 0-based
  const dd = String(now.getDate()).padStart(2, '0')
  const yyyy = now.getFullYear()
  const dateFormatted = `${mm}/${dd}/${yyyy}`

  // Assign to refs
  currentDate.value = dateFormatted
  currentTime.value = time12hr
}

let intervalId: number

onMounted(() => {
  fetchWeather() // fetch main data on mount
  getDateTime() // run immediately
  console.log('Data: ', weather);
  intervalId = window.setInterval(getDateTime, 1000) // update every 1s
})

onUnmounted(() => {
  clearInterval(intervalId)
})
</script>

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
          <div class="flex flex-col">
            <p class="text-black text-3xl xl:text-5xl font-sans font-normal text-center">{{ location }}</p>
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
                        v-for="unit in ['C','F']"
                        :key="unit"
                        @click="temperatureUnit = unit"
                        class="text-sm font-extralight p-1 px-1.5 w-full cursor-pointer transition-all duration-300 ease-in-out"
                        :class="[
                          temperatureUnit === unit
                            ? 'bg-[#E3A789] text-gray-200 scale-105 shadow-md'
                            : 'bg-gray-300 text-black hover:scale-105 hover:shadow-sm',
                          unit === 'C' ? 'rounded-bl-xl' : 'rounded-br-xl'
                        ]"
                      >{{ unit === 'C' ? '℃' : '℉' }}</button>
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
                          v-for="option in ['Precipitation','Humidity','UV Index','Day Temperature','Sunrise & Sunset']"
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
                      v-for="unit in ['C','F']"
                      :key="unit"
                      @click="temperatureUnit = unit"
                      class="text-sm sm:text-base font-extralight p-1 px-1.5 w-full cursor-pointer transition-all duration-300 ease-in-out"
                      :class="[
                        temperatureUnit === unit
                          ? 'bg-[#E3A789] text-gray-200 scale-105 shadow-md'
                          : 'bg-gray-300 text-black hover:scale-105 hover:shadow-sm',
                        unit === 'C' ? 'rounded-bl-xl' : 'rounded-br-xl'
                      ]"
                    >{{ unit === 'C' ? '℃' : '℉' }}</button>
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
                        v-for="unit in ['kt','kph','mph','mps']"
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
                        v-for="unit in ['kt','kph','mph','mps']"
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
                        v-for="unit in ['bar','kt','hPa','mb']"
                        :key="unit"
                        @click="pressureUnit = unit"
                        class="text-[0.6rem] sm:text-base font-extralight p-1 px-1.5 w-full cursor-pointer transition-all duration-300 ease-in-out"
                        :class="[
                          pressureUnit === unit
                            ? 'bg-[#E3A789] text-gray-200 scale-105 shadow-md'
                            : 'bg-gray-300 text-black hover:scale-105 hover:shadow-sm',
                          unit === 'bar' ? 'rounded-tl-xl' : unit === 'mb' ? 'rounded-tr-xl' : ''
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
                        v-for="unit in ['C','F','PDP','K']"
                        :key="unit"
                        @click="dewPointUnit = unit"
                        class="text-[0.6rem] sm:text-base font-extralight p-1 px-1.5 w-full cursor-pointer transition-all duration-300 ease-in-out"
                        :class="[
                          dewPointUnit === unit
                            ? 'bg-[#E3A789] text-gray-200 scale-105 shadow-md'
                            : 'bg-gray-300 text-black hover:scale-105 hover:shadow-sm',
                          unit === 'C' ? 'rounded-tl-xl' : unit === 'K' ? 'rounded-tr-xl' : ''
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
