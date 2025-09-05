<template>
  <div class="chart-wrapper" ref="chartWrapper">
    <div class="chart-scroll" ref="chartScroll">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue'
import { Chart, registerables } from 'chart.js'

// Register all chart.js components once, globally
Chart.register(...registerables)

export default defineComponent({
  name: 'Chart',
  setup() {
    const chartCanvas = ref<HTMLCanvasElement | null>(null)
    const chartWrapper = ref<HTMLDivElement | null>(null)
    const chartScroll = ref<HTMLDivElement | null>(null)
    let chartInstance: Chart | null = null
    let showingWeekly = false

    // 24h forecast labels
    const hourlyLabels = Array.from({ length: 24 }, (_, i) =>
      `${i === 0 || i === 12 ? 12 : i % 12}:00 ${i < 12 ? 'AM' : 'PM'}`
    )
    const hourlyData = Array.from({ length: 24 }, () =>
      Math.floor(Math.random() * 50) + 10
    )

    // Weekly forecast labels
    const weeklyLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const weeklyData = [55, 42, 60, 48, 70, 65, 50]

    // dataset builder
    const buildDataset = (
      labels: string[],
      data: number[],
      mode: 'hourly' | 'weekly'
    ) => {
      const isWeekly = mode === 'weekly'
      const lineColor = isWeekly ? '#E3A789' : '#4A67FF'

      return {
        labels: [...labels],
        datasets: [{
          label: 'Precipitation',
          data: [...data],
          fill: true,
          borderColor: lineColor,
          borderWidth: 2,
          tension: 0.4,
          pointBackgroundColor: lineColor,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          backgroundColor: (ctx: any) => {
            const chart = ctx.chart
            const { ctx: canvasCtx, chartArea } = chart
            if (!chartArea) return null
            const gradient = canvasCtx.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom
            )
            if (isWeekly) {
              gradient.addColorStop(0, 'rgba(227, 167, 137, 0.7)')
              gradient.addColorStop(0.7, 'rgba(227, 167, 137, 0.3)')
              gradient.addColorStop(1, 'rgba(227, 167, 137, 0.1)')
            } else {
              gradient.addColorStop(0, 'rgba(74, 103, 255, 0.7)')
              gradient.addColorStop(0.7, 'rgba(74, 103, 255, 0.3)')
              gradient.addColorStop(1, 'rgba(74, 103, 255, 0.1)')
            }
            return gradient
          }
        }]
      }
    }

    const chartOptions: any = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          displayColors: false,
          callbacks: {
            label: function (context: any) {
              return `${context.parsed.y} mm`
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            drawTicks: false,
            drawBorder: false,
            color: 'rgba(0,0,0,0.3)',
            borderDash: [4, 4],
          },
          ticks: {
            color: '#6B7280',
            font: { size: 10 }
          }
        },
        y: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 10,
            callback: (value: number) => `${value} mm`,
            color: '#6B7280',
            font: { size: 10 }
          },
          grid: { color: '#E0E0E0' }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index' as const
      }
    }

    const initChart = () => {
      if (chartCanvas.value) {
        const ctx = chartCanvas.value.getContext('2d')
        if (ctx) {
          chartInstance = new Chart(ctx, {
            type: 'line',
            data: buildDataset(hourlyLabels, hourlyData, 'hourly'),
            options: chartOptions
          })

          if (chartScroll.value) {
            chartScroll.value.style.width = hourlyLabels.length * 80 + 'px'
          }
        }
      }
    }

    let switchTimeout: ReturnType<typeof setTimeout> | null = null

    const handleScroll = () => {
        if (!chartWrapper.value || !chartScroll.value || !chartInstance) return

        const { scrollLeft, clientWidth, scrollWidth } = chartWrapper.value

        // Extra null checks just in case
        if (scrollLeft == null || clientWidth == null || scrollWidth == null) return

        const nearEnd = scrollLeft + clientWidth >= scrollWidth - 10
        const nearStart = scrollLeft <= 10

        if ((nearEnd && !showingWeekly) || (nearStart && showingWeekly)) {
            if (!switchTimeout) {
            switchTimeout = setTimeout(() => {
                if (!chartInstance || !chartScroll.value) return // safeguard inside timeout too

                if (nearEnd && !showingWeekly) {
                showingWeekly = true
                chartInstance.data = buildDataset(weeklyLabels, weeklyData, 'weekly')
                chartScroll.value.style.width = weeklyLabels.length * 120 + 'px'
                chartInstance.update()
                } else if (nearStart && showingWeekly) {
                showingWeekly = false
                chartInstance.data = buildDataset(hourlyLabels, hourlyData, 'hourly')
                chartScroll.value.style.width = hourlyLabels.length * 80 + 'px'
                chartInstance.update()
                }

                switchTimeout = null
            }, 1000) // must hold at edge for 1 second
            }
        } else {
            if (switchTimeout) {
            clearTimeout(switchTimeout)
            switchTimeout = null
            }
        }
    }



    onMounted(() => {
      initChart()
      if (chartWrapper.value) {
        chartWrapper.value.addEventListener('scroll', handleScroll)
      }
    })

    onUnmounted(() => {
      if (chartInstance) chartInstance.destroy()
      if (chartWrapper.value) {
        chartWrapper.value.removeEventListener('scroll', handleScroll)
      }
    })

    return { chartCanvas, chartWrapper, chartScroll }
  }
})
</script>

<style scoped>
.chart-wrapper {
  width: 100%;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}

.chart-scroll {
  height: 100%;
  transition: width 0.3s ease;
}

/* The core fix:
  - Removed width: 100% !important
  This allows the canvas to stretch to the width of its parent (.chart-scroll)
  which has the dynamic width calculated in the script.
*/
canvas {
  display: block;
  height: 100% !important;
}
</style>