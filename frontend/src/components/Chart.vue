<template>
  <div class="chart-wrapper hide-chart-scroll" ref="chartWrapper">
    <div class="chart-scroll hide-chart-scroll" ref="chartScroll">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, watch, type PropType } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

export default defineComponent({
  name: 'Chart',
  props: {
    data: {
      type: Object as PropType<{ daily: any[], hourly: any[] }>,
      default: () => ({ daily: [], hourly: [] })
    },
    dataType: {
      type: String,
      default: 'Precipitation'
    }
  },
  setup(props) {
    const chartCanvas = ref<HTMLCanvasElement | null>(null)
    const chartWrapper = ref<HTMLDivElement | null>(null)
    const chartScroll = ref<HTMLDivElement | null>(null)
    let chartInstance: Chart | null = null

    let showingWeekly = false
    let switchTimeout: ReturnType<typeof setTimeout> | null = null

    let hasScrolledSinceSwitch = false
    let isProgrammaticScroll = false

    // Extract the correct value for each type
    const extractField = (item: any, type: string): number => {
      switch (type) {
        case 'Precipitation': return item.precipitation
        case 'Humidity': return item.humidity
        case 'UV Index': return item.uvIndex
        case 'Day Temperature': return item.temp
        case 'Sunrise & Sunset': {
          const sunrise = new Date(`1970-01-01T${item.sunrise}Z`)
          const sunset = new Date(`1970-01-01T${item.sunset}Z`)
          const hours = (sunset.getTime() - sunrise.getTime()) / (1000 * 60 * 60)
          return Number(hours.toFixed(1))
        }
        default: return 0
      }
    }

    // Weekly forecast
    const getWeeklyLabels = () => props.data.daily.map(d => d.day)
    const getWeeklyData = () => props.data.daily.map(d => extractField(d, props.dataType))

    // Hourly forecast
    const getHourlyLabels = () => {
      // Take only the first day’s hours
      const firstDay = props.data.hourly.filter(h => h.day === props.data.daily[0]?.day)
      return firstDay.map((h, i) => h.time || `Hour ${i + 1}`)
    }

    const getHourlyData = () => {
      const firstDay = props.data.hourly.filter(h => h.day === props.data.daily[0]?.day)
      return firstDay.map(h => extractField(h, props.dataType))
    }

    // Units per type
    const getDataUnit = () => {
      switch (props.dataType) {
        case 'Precipitation': return 'mm'
        case 'Humidity': return '%'
        case 'UV Index': return ''
        case 'Day Temperature': return '°C'
        case 'Sunrise & Sunset': return 'h'
        default: return ''
      }
    }

    const getMaxValue = (data: number[]) => {
      const maxData = Math.max(...data, 0)
      const roundedMax = Math.ceil(maxData / 10) * 10
      return Math.max(roundedMax, 20)
    }

    const getColorScheme = (dataType: string, isWeekly: boolean) => {
      const colorMap: Record<string, { primary: string, rgba: string }> = {
        'Precipitation': { primary: '#4A67FF', rgba: '74, 103, 255' },
        'Humidity': { primary: '#2563EB', rgba: '37, 99, 235' },
        'UV Index': { primary: '#F59E0B', rgba: '245, 158, 11' },
        'Day Temperature': { primary: '#EF4444', rgba: '239, 68, 68' },
        'Sunrise & Sunset': { primary: '#F97316', rgba: '249, 115, 22' }
      }
      const colors = colorMap[dataType] || colorMap['Precipitation']
      if (isWeekly) {
        return { primary: '#E3A789', rgba: '227, 167, 137' }
      }
      return colors
    }

    const buildDataset = (
      labels: string[],
      data: number[],
      mode: 'hourly' | 'weekly'
    ) => {
      const isWeekly = mode === 'weekly'
      const colors = getColorScheme(props.dataType, isWeekly)
      // const unit = getDataUnit()

      return {
        labels: [...labels],
        datasets: [{
          label: props.dataType,
          data: [...data],
          fill: true,
          borderColor: colors.primary,
          borderWidth: 2,
          tension: 0.4,
          pointBackgroundColor: colors.primary,
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
            gradient.addColorStop(0, `rgba(${colors.rgba}, 0.7)`)
            gradient.addColorStop(0.7, `rgba(${colors.rgba}, 0.3)`)
            gradient.addColorStop(1, `rgba(${colors.rgba}, 0.1)`)
            return gradient
          }
        }]
      }
    }

    const getChartOptions = (data: number[]) => {
  const unit = getDataUnit()
  const maxValue = getMaxValue(data)

  return {
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
            const value = context.parsed.y
            if (props.dataType === 'Sunrise & Sunset') {
              return `${value.toFixed(1)} hours daylight`
            }
            return `${value}${unit ? ' ' + unit : ''}`
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
        max: maxValue,
        ticks: {
          stepSize: Math.max(1, Math.floor(maxValue / 10)),
          // ✅ Fixed callback signature
          callback: function(tickValue: string | number) {
            const value = typeof tickValue === 'string' ? parseFloat(tickValue) : tickValue
            if (props.dataType === 'Sunrise & Sunset') {
              return `${value}h`
            }
            return `${value}${unit ? ' ' + unit : ''}`
          },
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
}

    const initChart = () => {
      if (chartCanvas.value) {
        const ctx = chartCanvas.value.getContext('2d')
        if (ctx) {
          const hourlyLabels = getHourlyLabels()
          const hourlyData = getHourlyData()

          chartInstance = new Chart(ctx, {
            type: 'line',
            data: buildDataset(hourlyLabels, hourlyData, 'hourly'),
            options: getChartOptions(hourlyData)
          })

          if (chartScroll.value) {
            chartScroll.value.style.width = hourlyLabels.length * 80 + 'px'
          }
        }
      }
    }

    const updateChart = () => {
      if (!chartInstance) return

      if (showingWeekly) {
        const weeklyLabels = getWeeklyLabels()
        const weeklyData = getWeeklyData()

        chartInstance.data = buildDataset(weeklyLabels, weeklyData, 'weekly')
        chartInstance.options = getChartOptions(weeklyData) as any
        if (chartScroll.value) {
          chartScroll.value.style.width = weeklyLabels.length * 120 + 'px'
        }
      } else {
        const hourlyLabels = getHourlyLabels()
        const hourlyData = getHourlyData()

        chartInstance.data = buildDataset(hourlyLabels, hourlyData, 'hourly')
        chartInstance.options = getChartOptions(hourlyData) as any
        if (chartScroll.value) {
          chartScroll.value.style.width = hourlyLabels.length * 80 + 'px'
        }
      }

      chartInstance.update()
    }

    const safeSetScrollLeft = (pos: number) => {
      if (!chartWrapper.value) return
      isProgrammaticScroll = true
      chartWrapper.value.scrollLeft = pos
      requestAnimationFrame(() => { isProgrammaticScroll = false })
    }

    const handleScroll = () => {
      if (!chartWrapper.value || !chartScroll.value || !chartInstance) return
      const { scrollLeft, clientWidth, scrollWidth } = chartWrapper.value
      if (isProgrammaticScroll) return
      hasScrolledSinceSwitch = true

      const nearEnd = scrollLeft + clientWidth >= scrollWidth - 10
      const nearStart = scrollLeft <= 10

      const canSwitchToWeekly = nearEnd && !showingWeekly && hasScrolledSinceSwitch
      const canSwitchToHourly = nearStart && showingWeekly && hasScrolledSinceSwitch

      if (canSwitchToWeekly || canSwitchToHourly) {
        if (!switchTimeout) {
          switchTimeout = setTimeout(() => {
            if (canSwitchToWeekly) {
              showingWeekly = true
              hasScrolledSinceSwitch = false
              updateChart()
              safeSetScrollLeft(0)
            } else if (canSwitchToHourly) {
              showingWeekly = false
              hasScrolledSinceSwitch = false
              updateChart()
              if (chartWrapper.value) safeSetScrollLeft(chartWrapper.value.scrollWidth)
            }
            switchTimeout = null
          }, 1000)
        }
      } else {
        if (switchTimeout) {
          clearTimeout(switchTimeout)
          switchTimeout = null
        }
      }
    }

    watch(() => [props.data, props.dataType], () => {
      updateChart()
      console.log('📊 Chart received new data:', props.data)
    }, { deep: true })

    onMounted(() => {
      initChart()
      if (chartWrapper.value) {
        chartWrapper.value.addEventListener('scroll', handleScroll, { passive: true })
      }
    })

    onUnmounted(() => {
      if (chartInstance) chartInstance.destroy()
      if (chartWrapper.value) {
        chartWrapper.value.removeEventListener('scroll', handleScroll)
      }
      if (switchTimeout) {
        clearTimeout(switchTimeout)
        switchTimeout = null
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
canvas {
  display: block;
  height: 100% !important;
}
.hide-chart-scroll {
  overflow-x: scroll;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.hide-chart-scroll::-webkit-scrollbar {
  display: none;
}
</style>
