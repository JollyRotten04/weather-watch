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
    <div class="relative z-5 w-full md:w-4/5 lg:w-3/5 xl:w-[50rem] p-4 flex flex-col justify-center mx-auto min-h-screen">

      <!-- Content Container -->
      <div class="relative w-full z-10 lg:rounded-2xl">

        <!-- Transparent Effect -->
        <div class="absolute z-15 left-0 top-0 h-full w-full opacity-50 bg-gray-200 rounded-xl"></div>

        <!-- Content -->
        <div class="relative z-20 w-full p-4 lg:p-6 xl:p-8 flex flex-col gap-8">

          <!-- Basic Info -->
          <div class="flex flex-col">
            <p class="text-black text-3xl font-sans font-normal text-center">City in Country</p>
            <p class="text-black text-xl font-sans font-light text-center">Time Right Now</p>
            <p class="text-black text-lg font-sans font-light text-center">Date Today</p>
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
                      @click="infoOptions = option"
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
                    <p class="text-black font-normal text-2xl text-center">25℃</p>
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
                          @click="infoOptions = option"
                          class="p-3 h-12 flex items-center justify-center flex-col rounded-lg cursor-pointer transition-all duration-300 ease-in-out w-full"
                          :class="infoOptions === option 
                            ? 'bg-[#4A67FF] text-white scale-105 shadow-lg' 
                            : 'bg-white opacity-60 text-black hover:scale-105 hover:shadow-md'"
                        >
                          <p class="text-[0.5rem] sm:text-[0.5rem] xl:text-[0.6rem] text-center font-semibold">{{ option }}</p>
                        </div>
                      </TransitionGroup>
                    </div>
                  </div>

                  <!-- Chart -->
                  <div class="p-2 bg-gray-300 h-48 landscape:h-32 lg:landscape:h-40 xl:landscape:h-48 rounded-xl overflow-hidden">
                    <Chart />
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
                  <p class="text-black font-normal text-2xl sm:text-3xl text-center">25℃</p>
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
                    <p class="text-black font-normal text-2xl sm:text-3xl text-center">5 {{ windSpeedUnit }}</p>
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
                    <p class="text-black font-normal text-2xl sm:text-3xl text-center">8 {{ gustSpeedUnit }}</p>
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
                    <p class="text-black font-normal text-2xl sm:text-3xl text-center">1 {{ pressureUnit }}</p>
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
                    <p class="text-black font-normal text-lg sm:text-xl text-center">10℃ - 15℃</p>
                    <p class="text-black font-normal text-[0.45rem] sm:text-[0.65rem] text-center">Dew Point Temperature</p>
                  </div>
                </div>

                <!-- Air Quality -->
                <div class="flex flex-col gap-2 items-center">
                  <div class="bg-gray-300 h-32 landscape:h-full md:h-full sm:h-full w-full p-4 rounded-xl shadow-xl flex flex-col justify-center items-center">
                    <p class="text-black font-normal text-2xl sm:text-3xl text-center">50 AQI</p>
                    <p class="text-black font-normal text-[0.45rem] sm:text-[0.65rem] text-center">Air Quality</p>
                  </div>
                </div>

                <!-- Chance of Rain -->
                <div class="flex flex-col gap-2 items-center">
                  <div class="bg-gray-300 h-32 landscape:h-full md:h-full sm:h-full w-full p-4 rounded-xl shadow-xl flex flex-col justify-center items-center">
                    <p class="text-black font-normal text-2xl sm:text-3xl text-center">60%</p>
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
