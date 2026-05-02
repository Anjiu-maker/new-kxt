import * as echarts from 'echarts'

export function initChart(domId) {
  const dom = document.getElementById(domId)
  if (!dom) return null
  let instance = echarts.getInstanceByDom(dom)
  if (!instance) {
    instance = echarts.init(dom)
  }
  return instance
}

export function disposeChart(domId) {
  const dom = document.getElementById(domId)
  if (dom) {
    echarts.dispose(dom)
  }
}

export function makeGaugeOption(value, color = '#a5c340', title = '') {
  return {
    title: title ? { text: title, left: 'center', bottom: 0, textStyle: { fontSize: 12, color: '#666' } } : undefined,
    series: [{
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      min: 0,
      max: 100,
      radius: '100%',
      center: ['50%', '55%'],
      splitNumber: 10,
      axisLine: {
        show: true,
        lineStyle: { width: 20, color: [[1, '#e6ecf0']] }
      },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      detail: {
        formatter: '{value}%',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        offsetCenter: [0, '60%']
      },
      data: [{ value, name: title }],
      pointer: { show: false },
      itemStyle: { color }
    }]
  }
}

export function makeDonutOption(data, legendData, colors) {
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: legendData,
      formatter(name) {
        const item = data.find((d) => d.name === name)
        return item ? `${name}  ${item.value}` : name
      }
    },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 2, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data,
      color: colors || ['#3aa0ff', '#a5c340', '#f75863', '#fad337', '#36cfc9', '#b37feb', '#ff9c6e']
    }]
  }
}

export function makeLineOption(xData, seriesData, unit = '%') {
  return {
    tooltip: {
      trigger: 'axis',
      formatter(params) {
        return params.map((p) => `${p.marker}${p.seriesName}：${p.value}${unit}<br/>`).join('')
      }
    },
    legend: {
      top: '5%',
      data: seriesData.map((s) => s.name)
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: { type: 'category', data: xData, boundaryGap: false },
    yAxis: { type: 'value', axisLabel: { formatter: `{value}${unit}` } },
    series: seriesData.map((s) => ({
      name: s.name,
      type: 'line',
      smooth: true,
      data: s.data,
      itemStyle: { color: s.color || '#3aa0ff' }
    }))
  }
}

export function makeBarLineOption(xData, barSeries, lineSeries) {
  return {
    tooltip: { trigger: 'axis' },
    legend: {
      data: [...barSeries.map((s) => s.name), ...lineSeries.map((s) => s.name)],
      top: '5%'
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: { type: 'category', data: xData },
    yAxis: [
      { type: 'value', name: '件数' },
      { type: 'value', name: '%', axisLabel: { formatter: '{value}%' } }
    ],
    series: [
      ...barSeries.map((s) => ({
        name: s.name,
        type: 'bar',
        data: s.data,
        itemStyle: { color: s.color || '#3aa0ff' },
        barMaxWidth: 30
      })),
      ...lineSeries.map((s, i) => ({
        name: s.name,
        type: 'line',
        yAxisIndex: 1,
        data: s.data,
        itemStyle: { color: s.color || '#f75863' },
        smooth: true
      }))
    ]
  }
}

export default { initChart, disposeChart, makeGaugeOption, makeDonutOption, makeLineOption, makeBarLineOption }
