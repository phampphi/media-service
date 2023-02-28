const QuickChart = require('quickchart-js');

const pteScoreData = {
  datasets: [{
    backgroundColor: [
      'rgb(19, 59, 90)',
      'rgb(204, 221, 0)',
      'rgb(120, 119, 124)',
      'rgb(171, 22, 131)',
    ],
    borderColor: [
      'rgb(19, 59, 90)',
      'rgb(204, 221, 0)',
      'rgb(120, 119, 124)',
      'rgb(171, 22, 131)',
    ],
    borderWidth: 1,
    barPercentage: 0.9,
    categoryPercentage: 0.9,
    label: '',
  }]
};

const enablingScoreData = {
  datasets: [{
    backgroundColor: [
      'rgb(12,188,179)',
    ],
    borderColor: [
      'rgb(12,188,179)',
    ],
    borderWidth: 1,
    barPercentage: 0.9,
    categoryPercentage: 0.9,
    label: 'Enabling Skills',
  }]
};

const config = {
  type: 'horizontalBar',
  data: pteScoreData,
  options: {
    title: {
      display: true,
      fontSize: 16,
      fontFamily: 'OpenSans',
      fontColor: '#000000'
    },
    scales: {
      xAxes: [{
        gridLines: {
          drawOnChartArea: false
        },
        ticks: {
          beginAtZero: true,
          min: 0,
          max: 90,
          stepSize: 10,
          fontSize: 14,
          fontFamily: 'OpenSans',
        }
      }],
      yAxes: [{
        gridLines: {
          drawOnChartArea: false
        },
        ticks: {
          fontSize: 14,
          fontFamily: 'OpenSans',
          padding: 22
        }
      }]
    },
    legend: {
      display: false
    },
    plugins: {
      datalabels: {
        display: true,
        anchor: 'start',
        align: 'start',
        color: 'black',
        font: {
          size: 15,
          family: 'OpenSans'
        }
      },
    }
  }
};

export const generatePteScoreChart = async (chartLabels, chartData) => {
  config.data = pteScoreData;
  config.data.labels = chartLabels;
  config.data.datasets[0].data = chartData;
  const chart = new QuickChart();
  chart.setConfig(config);
  // chart.toFile('assets/pteScore.png');
  return await chart.toDataUrl();
};

export const generateEnablingScoreChart = async (chartLabels, chartData) => {
  config.data = enablingScoreData;
  config.data.labels = chartLabels;
  config.data.datasets[0].data = chartData;
  config.options.title.display = true;
  config.options.title.text = 'Enabling Skills';

  const chart = new QuickChart();
  chart.setConfig(config);
  // chart.toFile('assets/enablingScore.png');
  return await chart.toDataUrl();
};