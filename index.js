// Function to apply colors to all charts based on selected couple and optional hover
function applyColors(charts, data, judges, binLabels, minScore, binSize, selectedPareja, includeHover = false, hoveredIndex = -1) {
    Object.values(charts).forEach(chart => {
        const judge = chart.judge;
        let colors = new Array(binLabels.length).fill('rgba(75, 192, 192, 0.4)');
        
        if (selectedPareja) {
            const couple = data.find(d => d.PAREJA === selectedPareja);
            const s = couple[judge];
            const binIndex = Math.round((s - minScore) / binSize);
            colors[binIndex] = 'rgba(0, 0, 255, 0.4)'; // Blue for couple highlight
        }
        
        if (includeHover && hoveredIndex >= 0) {
            colors[hoveredIndex] = 'rgba(153, 102, 255, 0.4)'; // Purple for hover highlight (overrides if conflict)
        }
        
        chart.data.datasets[0].backgroundColor = colors;
        chart.update();
    });
}

// Main function to load and process data
fetch('tango-2025-pista-semi.csv')
    .then(response => response.text())
    .then(csvText => {
        // Parse the CSV data
        const rows = csvText.trim().split('\n').map(line => line.split(','));
        const headers = rows[0];
        const data = rows.slice(1).map(row => {
            const obj = {};
            headers.forEach((h, i) => {
                obj[h] = (i < 3) ? row[i] : parseFloat(row[i]);
            });
            return obj;
        });

        // Extract judge names (excluding PAREJA, Partner1, Partner2, PROMEDIO)
        const judges = headers.slice(3, -1);

        // Define bin parameters
        const binSize = 0.05;
        const minScore = 7;
        const maxScore = 10;
        const binLabels = [];
        for (let i = minScore; i <= maxScore + 0.001; i += binSize) {
            binLabels.push(i.toFixed(2));
        }

        // Prepare histograms and medians
        const histograms = {};
        const medians = {};
        judges.forEach(judge => {
            const scores = data.map(d => d[judge]);
            const freq = new Array(binLabels.length).fill(0);
            scores.forEach(s => {
                const binIndex = Math.round((s - minScore) / binSize);
                if (binIndex >= 0 && binIndex < freq.length) {
                    freq[binIndex]++;
                }
            });
            histograms[judge] = freq;

            // Calculate median
            const sortedScores = scores.slice().sort((a, b) => a - b);
            const mid = sortedScores.length / 2;
            medians[judge] = (sortedScores.length % 2 === 0)
                ? (sortedScores[mid - 1] + sortedScores[mid]) / 2
                : sortedScores[Math.floor(mid)];
        });

        // Create dropdown for couples
        const select = document.createElement('select');
        select.id = 'pareja-select';
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select a Couple';
        select.appendChild(defaultOption);
        data.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.PAREJA;
            opt.textContent = `${d.PAREJA} - ${d.Partner1} & ${d.Partner2}`;
            select.appendChild(opt);
        });
        document.getElementById('input-field').appendChild(select);

        // Container for histograms
        const container = document.getElementById('histograms');
        const charts = {};
        let selectedPareja = null;

        // Create a chart for each judge
        judges.forEach(judge => {
            const div = document.createElement('div');
            div.className = 'histogram';
            const title = document.createElement('h3');
            title.textContent = judge;
            const canvas = document.createElement('canvas');
            canvas.id = 'chart-' + judge.replace(/ /g, '');
            div.appendChild(title);
            div.appendChild(canvas);
            container.appendChild(div);

            const ctx = canvas.getContext('2d');
            const median = medians[judge];
            const freq = histograms[judge];

            const chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    datasets: [{
                        label: 'Frequency',
                        data: binLabels.map((label, i) => ({
                            x: parseFloat(label),
                            y: freq[i]
                        })),
                        backgroundColor: new Array(binLabels.length).fill('rgba(75, 192, 192, 0.4)'),
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        x: {
                            type: 'linear',
                            min: minScore,
                            max: maxScore,
                            title: { display: true, text: 'Judge Scores' },
                            ticks: { stepSize: 0.5 }
                        },
                        y: {
                            title: { display: true, text: 'Frequency' },
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        annotation: {
                            annotations: {
                                medianLine: {
                                    type: 'line',
                                    xMin: median,
                                    xMax: median,
                                    borderColor: 'red',
                                    borderWidth: 1,
                                }
                            }
                        }
                    },
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    onHover: (event, elements) => {
                        if (elements.length > 0) {
                            const hoveredIndex = elements[0].index;
                            applyColors(charts, data, judges, binLabels, minScore, binSize, selectedPareja, true, hoveredIndex);
                        } else {
                            applyColors(charts, data, judges, binLabels, minScore, binSize, selectedPareja, false);
                        }
                    }
                }
            });

            chart.judge = judge;
            charts[judge] = chart;
        });

        // Handle dropdown change
        select.addEventListener('change', (e) => {
            selectedPareja = e.target.value || null;
            applyColors(charts, data, judges, binLabels, minScore, binSize, selectedPareja);
        });
    })
    .catch(error => console.error('Error loading CSV:', error));
