// index.js

// Dimensions and margins for the histograms
const width = 300;
const height = 200;
const margin = { top: 20, right: 20, bottom: 30, left: 40 };

// Function to calculate median
function calculateMedian(sortedArr) {
  const len = sortedArr.length;
  if (len === 0) return 0;
  if (len % 2 === 1) {
    return sortedArr[Math.floor(len / 2)];
  } else {
    return (sortedArr[len / 2 - 1] + sortedArr[len / 2]) / 2;
  }
}

// Function to update histograms based on current selections
function updateHistograms(data, judges) {
  const cutoffSelect = document.getElementById('cutoff');
  const parejaSelect = document.getElementById('pareja');
  const N = parseInt(cutoffSelect.value, 10);
  const selectedIndex = parejaSelect.value;
  const filteredData = data.slice(0, N);
  const selectedRow = selectedIndex !== '' ? data[selectedIndex] : null;

  // Clear existing histograms
  d3.select('#histograms').selectAll('*').remove();

  // Precompute bins, medians, and max frequency for consistent y-scale
  const judgeBins = {};
  const judgeMedians = {};
  let maxFreq = 0;
  const thresholds = d3.range(7, 10.1, 0.1);
  judges.forEach(judge => {
    const scores = filteredData.map(d => d[judge]);
    const histogram = d3.histogram()
      .value(d => d)
      .domain([7, 10])
      .thresholds(thresholds);
    const bins = histogram(scores);
    judgeBins[judge] = bins;
    const sortedScores = [...scores].sort((a, b) => a - b);
    judgeMedians[judge] = calculateMedian(sortedScores);
    maxFreq = Math.max(maxFreq, d3.max(bins, b => b.length));
  });

  // Draw histogram for each judge
  judges.forEach(judge => {
    const bins = judgeBins[judge];
    const median = judgeMedians[judge];

    // Create container for each histogram
    const container = d3.select('#histograms')
      .append('div')
      .classed('hist-container', true);

    container.append('h3').text(judge);

    const svg = container.append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // X scale
    const x = d3.scaleLinear()
      .domain([7, 10])
      .range([0, width]);

    // Y scale (shared max)
    const y = d3.scaleLinear()
      .domain([0, maxFreq])
      .range([height, 0]);

    // Draw bars
    g.selectAll('.bar')
      .data(bins)
      .enter()
      .append('rect')
      .classed('bar', true)
      .attr('x', d => x(d.x0))
      .attr('width', d => x(d.x1) - x(d.x0))
      .attr('y', d => y(d.length))
      .attr('height', d => y(0) - y(d.length))
      .attr('fill', 'steelblue')
      .on('mouseover', function(event, d) {
        // Highlight corresponding bars (same bin) across all histograms
        d3.selectAll('.bar')
          .classed('highlighted', b => Math.abs(b.x0 - d.x0) < 1e-6);
      })
      .on('mouseout', function() {
        // Remove highlight
        d3.selectAll('.bar').classed('highlighted', false);
      });

    // Draw median line
    g.append('line')
      .attr('x1', x(median))
      .attr('x2', x(median))
      .attr('y1', y(0))
      .attr('y2', y(maxFreq))
      .attr('stroke', 'red')
      .attr('stroke-dasharray', '5,5');

    // If a couple is selected, highlight the corresponding bar for this judge
    if (selectedRow) {
      const score = selectedRow[judge];
      g.selectAll('.bar')
        .filter(d => score >= d.x0 && score < d.x1)
        .classed('selected', true);
    }

    // X axis
    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x));

    // Y axis
    g.append('g')
      .call(d3.axisLeft(y));

    // Axis labels
    svg.append('text')
      .attr('transform', `translate(${margin.left + width / 2}, ${height + margin.top + margin.bottom - 5})`)
      .style('text-anchor', 'middle')
      .text('Judge Scores');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', margin.left / 2 - 10)
      .attr('x', -(height / 2 + margin.top))
      .style('text-anchor', 'middle')
      .text('Frequency');
  });
}

// Load and parse the CSV data
d3.csv('tango-2025-pista-semi.csv').then(function(data) {
  // Parse numeric values
  const judges = Object.keys(data[0]).slice(3, -1); // Judges are columns from 3 to second last
  data.forEach(d => {
    judges.forEach(j => d[j] = parseFloat(d[j]));
    d.PROMEDIO = parseFloat(d.PROMEDIO);
  });

  // Populate Pareja dropdown
  const parejaSelect = document.getElementById('pareja');
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.text = 'Select a couple';
  parejaSelect.add(defaultOption);
  data.forEach((d, i) => {
    const option = document.createElement('option');
    option.value = i;
    option.text = `${d.PAREJA}: ${d.Partner1} & ${d.Partner2}`;
    parejaSelect.add(option);
  });

  // Populate Data cutoff dropdown
  const cutoffSelect = document.getElementById('cutoff');
  const cutoffOptions = [5, 10, 20, 50, 100, 157];
  cutoffOptions.forEach(n => {
    const option = document.createElement('option');
    option.value = n;
    option.text = n;
    if (n === 157) option.selected = true;
    cutoffSelect.add(option);
  });

  // Attach change event listeners
  parejaSelect.onchange = () => updateHistograms(data, judges);
  cutoffSelect.onchange = () => updateHistograms(data, judges);

  // Initial draw
  updateHistograms(data, judges);
}).catch(error => {
  console.error('Error loading CSV:', error);
});