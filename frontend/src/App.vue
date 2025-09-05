<!-- Imports -->
<script setup lang="ts">    
  import { ref } from 'vue'
  import Chart from './components/Chart.vue'

  // State for main info options
  const infoOptions = ref('Precipitation')

  // State for units
  const temperatureUnit = ref('C')
  const windSpeedUnit = ref('kt')
  const gustSpeedUnit = ref('kt')
  const pressureUnit = ref('bar')
  const dewPointUnit = ref('C')
</script>

<template>
  <div class="min-h-screen w-full relative">

    <!-- Background image -->
    <img src="./assets/background.svg" class="object-cover min-h-full w-full absolute inset-0 z-1" />

    <!-- Main Container -->
    <div class="relative z-5 w-full p-4 flex flex-col justify-center min-h-screen">

      <!-- Content Container -->
      <div class="relative w-full z-10">

        <!-- Transparent Effect -->
        <div class="absolute z-15 left-0 top-0 h-full w-full opacity-50 bg-gray-200 rounded-xl"></div>

        <!-- Content -->
        <div class="relative z-20 w-full p-4 flex flex-col gap-8">

          <!-- Basic Info -->
          <div class="flex flex-col">
            <p class="text-black text-3xl font-sans font-normal text-center">City in Country</p>
            <p class="text-black text-xl font-sans font-light text-center">Time Right Now</p>
            <p class="text-black text-lg font-sans font-light text-center">Date Today</p>
          </div>

          <!-- Info Container -->
          <div class="flex flex-col gap-4">

            <!-- Display Info Container -->
            <div class="flex flex-col gap-4">
              <!-- First Stack Choices -->
              <div class="flex justify-center gap-4">
                <div
                  v-for="option in ['Precipitation','Humidity','UV Index']"
                  :key="option"
                  @click="infoOptions = option"
                  class="p-3 h-12 w-24 items-center flex flex-col justify-center rounded-lg cursor-pointer"
                  :class="infoOptions === option ? 'bg-[#4A67FF] text-white' : 'bg-white opacity-60 text-black'"
                >
                  <p class="text-[0.6rem] text-center font-semibold">{{ option }}</p>
                </div>
              </div>

              <!-- Second Stack Choices -->
              <div class="flex justify-center gap-4">
                <div
                  v-for="option in ['Day Temperature','Sunrise & Sunset']"
                  :key="option"
                  @click="infoOptions = option"
                  class="p-3 h-12 w-24 items-center flex flex-col justify-center rounded-lg cursor-pointer"
                  :class="infoOptions === option ? 'bg-[#4A67FF] text-white' : 'bg-white opacity-60 text-black'"
                >
                  <p class="text-[0.6rem] text-center font-semibold" v-html="option.replace('&','<br>')"></p>
                </div>
              </div>
            </div>

            <!-- Chart -->
            <div class="p-2 bg-gray-300 h-48 rounded-xl overflow-hidden">
              <Chart />
            </div>

            <!-- Other Info Container -->
            <div class="flex flex-col gap-4 w-full items-center">

              <!-- Top Container -->
              <div>
                <!-- Real Feel Temperature -->
                <div class="aspect-square flex flex-col gap-2">
                  <div class="bg-gray-300 p-4 rounded-tl-xl shadow-xl w-32 rounded-tr-xl flex flex-col">
                    <p class="text-black font-light font-sans text-center text-xs">Friday</p>
                    <p class="text-black font-normal font-sans text-2xl text-center">25℃</p>
                    <p class="text-black font-normal font-sans text-[0.45rem] text-center">Real Feel Temperature</p>
                  </div>

                  <!-- Button Containers -->
                  <div class="flex gap-2">
                    <button
                      v-for="unit in ['C','F']"
                      :key="unit"
                      @click="temperatureUnit = unit"
                      class="text-sm font-extralight p-1 px-1.5 w-full cursor-pointer"
                      :class="[
                        temperatureUnit === unit
                          ? 'bg-[#E3A789] text-gray-200'
                          : 'bg-gray-300 text-black',
                        unit === 'C' ? 'rounded-bl-xl' : 'rounded-br-xl'
                      ]"
                    >{{ unit === 'C' ? '℃' : '℉' }}</button>
                  </div>
                </div>
              </div>

             <div class="grid grid-cols-2 grid-rows-1 gap-4">

              <!-- Wind Speed -->
              <div class="flex flex-col h-30 gap-2">
                <div class="flex gap-2">
                  <button
                    v-for="unit in ['kt','kph','mph','mps']"
                    :key="unit"
                    @click="windSpeedUnit = unit"
                    class="text-[0.6rem] font-extralight p-1 px-1.5 w-full cursor-pointer"
                    :class="[
                      windSpeedUnit === unit ? 'bg-[#E3A789] text-gray-200' : 'bg-gray-300 text-black',
                      unit === 'kt' ? 'rounded-tl-xl' : unit === 'mps' ? 'rounded-tr-xl' : ''
                    ]"
                  >{{ unit }}</button>
                </div>
                <div class="bg-gray-300 p-4 rounded-b-xl shadow-xl flex-1 flex flex-col justify-center">
                  <p class="text-black font-normal font-sans text-2xl text-center">5 {{ windSpeedUnit }}</p>
                  <p class="text-black font-normal font-sans text-[0.45rem] text-center">Wind Speed</p>
                </div>
              </div>

              <!-- Gust Speed -->
              <div class="flex flex-col h-30 gap-2">
                <div class="flex gap-2">
                  <button
                    v-for="unit in ['kt','kph','mph','mps']"
                    :key="unit"
                    @click="gustSpeedUnit = unit"
                    class="text-[0.55rem] font-extralight p-1 px-1.5 w-full cursor-pointer"
                    :class="[
                      gustSpeedUnit === unit ? 'bg-[#E3A789] text-gray-200' : 'bg-gray-300 text-black',
                      unit === 'kt' ? 'rounded-tl-xl' : unit === 'mps' ? 'rounded-tr-xl' : ''
                    ]"
                  >{{ unit }}</button>
                </div>
                <div class="bg-gray-300 h-32 p-4 rounded-b-xl shadow-xl flex-1 flex flex-col justify-center">
                  <p class="text-black font-normal font-sans text-2xl text-center">8 {{ gustSpeedUnit }}</p>
                  <p class="text-black font-normal font-sans text-[0.45rem] text-center">Gust Speed</p>
                </div>
              </div>

              <!-- Atmospheric Pressure -->
              <div class="flex flex-col h-30 gap-2">
                <div class="flex gap-2">
                  <button
                    v-for="unit in ['bar','kt','hPa','mb']"
                    :key="unit"
                    @click="pressureUnit = unit"
                    class="text-[0.6rem] font-extralight p-1 px-1.5 w-full cursor-pointer"
                    :class="[
                      pressureUnit === unit ? 'bg-[#E3A789] text-gray-200' : 'bg-gray-300 text-black',
                      unit === 'bar' ? 'rounded-tl-xl' : unit === 'mb' ? 'rounded-tr-xl' : ''
                    ]"
                  >{{ unit }}</button>
                </div>
                <div class="bg-gray-300 p-4 rounded-b-xl shadow-xl flex-1 flex flex-col justify-center">
                  <p class="text-black font-normal font-sans text-2xl text-center">1 {{ pressureUnit }}</p>
                  <p class="text-black font-normal font-sans text-[0.45rem] text-center">Atmospheric Pressure</p>
                </div>
              </div>
              
              <!-- Dew Point Temperature -->
              <div class="flex flex-col h-30 gap-2">
                <div class="flex gap-2">
                  <button
                    v-for="unit in ['C','F','PDP','K']"
                    :key="unit"
                    @click="dewPointUnit = unit"
                    class="text-[0.6rem] font-extralight p-1 px-1.5 w-full cursor-pointer"
                    :class="[
                      dewPointUnit === unit ? 'bg-[#E3A789] text-gray-200' : 'bg-gray-300 text-black',
                      unit === 'C' ? 'rounded-tl-xl' : unit === 'K' ? 'rounded-tr-xl' : ''
                    ]"
                  >{{ unit === 'C' ? '℃' : unit === 'F' ? '℉' : unit }}</button>
                </div>
                <div class="bg-gray-300 p-4 rounded-b-xl shadow-xl flex-1 flex flex-col justify-center">
                  <p class="text-black font-normal font-sans text-lg text-center">10℃ - 15℃</p>
                  <p class="text-black font-normal font-sans text-[0.45rem] text-center">Dew Point Temperature</p>
                </div>
              </div>

              <!-- Air Quality -->
              <div class="flex flex-col h-30 gap-2">
                <div class="bg-gray-300 p-4 rounded-xl shadow-xl flex-1 flex flex-col justify-center">
                  <p class="text-black font-normal font-sans text-2xl text-center">50 AQI</p>
                  <p class="text-black font-normal font-sans text-[0.45rem] text-center">Air Quality</p>
                </div>
              </div>

              <!-- Chance of Rain -->
              <div class="flex flex-col h-30 gap-2">
                <div class="bg-gray-300 p-4 rounded-xl shadow-xl flex-1 flex flex-col justify-center">
                  <p class="text-black font-normal font-sans text-2xl text-center">60%</p>
                  <p class="text-black font-normal font-sans text-[0.45rem] text-center">Chance of Rain</p>
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
</style>