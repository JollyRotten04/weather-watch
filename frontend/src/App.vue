<script setup lang="ts">    
</script>

<template>
  <div class="overflow-hidden h-screen w-full relative">

    <!-- Background image -->
    <img src="./assets/background.svg" class="object-cover h-full w-full relative z-1" />

    <!-- Main Container -->
    <div class="absolute left-0 top-0 z-5 h-screen w-screen p-4 flex flex-col justify-center">

      <!-- Content Container -->
      <div class="relative h-10/12 w-full z-10">

        <!-- Transparent Effect -->
        <div class="absolute z-15 left-0 top-0 h-full w-full opacity-50 bg-gray-200">
      
        </div>

        <!-- Content -->
        <div class="absolute z-20 h-full w-full p-4 flex flex-col gap-8 overflow-hidden">

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

                <div class="bg-white opacity-60 p-3 h-12 w-24 items-center flex flex-col justify-center rounded-lg"><p class="text-black text-[0.6rem] text-center font-semibold">Precipitation</p></div>

                <div class="bg-white opacity-60 p-3 h-12 w-24 items-center flex flex-col justify-center rounded-lg"><p class="text-black text-[0.6rem] text-center font-semibold">Humidity</p></div>

                <div class="bg-white opacity-60 p-3 h-12 w-24 items-center flex flex-col justify-center rounded-lg"><p class="text-black text-[0.6rem] text-center font-semibold">UV Index</p></div>
              </div>

              <!-- Second Stack Choices -->
              <div class="flex justify-center gap-4">

                <div class="bg-white opacity-60 p-3 h-12 w-24 items-center flex flex-col justify-center rounded-lg"><p class="text-black text-[0.6rem] text-center font-semibold">Day <br> Temperature</p></div>

                <div class="bg-white opacity-60 p-3 h-12 w-24 items-center flex flex-col justify-center rounded-lg"><p class="text-black text-[0.6rem] text-center font-semibold">Sunrise & <br> Sunset</p></div>
              </div>
            </div>

            <!-- Chart -->
            <div class="p-4 bg-gray-300">

            </div>
    
          </div>
        </div>
      </div>
    </div>
     

  </div>
</template>

<style scoped>
</style>