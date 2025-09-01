// Load the CSV data and parse it
d3.csv("tango-2025-pista-semi.csv").then(function(data) {
    // List of judges from the CSV columns
    const judges = ["Tanguito Cejas", "Ricky Barrios", "Facundo Piñeiro", "Virginia Pandolfi", "Laila Rezk", "Silvia Alonso"];

    // Precompute scores for each pareja (couple) across all judges for quick lookup
    const parejaScores = {};
    data.forEach(d => {
        parejaScores[d.PAREJA] = judges.map(j => parseFloat(d[j]));
    });

    // Create a mapping of judge names to their indices in the scores array
    const judgeIndices = judges.reduce((acc, j, i) => {
        acc[j] = i;
        return acc;
    }, {});

    // Collect all scores to determine global min and max
    const allScores = [].concat(...Object.values(parejaScores));
    let minScore = d3.min(allScores);
    let maxScore = d3.max(allScores);

    // Round min and max to nearest 0.1 for consistent binning
    minScore = Math.floor(minScore * 10) / 10;
    maxScore = Math.ceil(maxScore * 10) / 10;

    // Set bin width and generate thresholds for histograms
    const binWidth = 0.1;
    const thresholds = d3.range(minScore + binWidth, maxScore + binWidth / 2, binWidth); // Interior thresholds

    // Create bin generator with value accessor
    const binGen = d3.bin().thresholds(thresholds).value(d => d.score);

    // Compute histograms and medians for each judge
    const histograms = judges.map(judge => {
        // Prepare data points with pareja and score
        const scores = data.map(d => ({pareja: d.PAREJA, score: parseFloat(d[judge])}));
        
        // Generate bins (each bin contains array of {pareja, score})
        const bins = binGen(scores);
        
        // Set explicit x0 and x1 for first and last bins if needed
        if (bins.length > 0) {
            bins[0].x0 = minScore;
            bins[bins.length - 1].x1 = maxScore + (maxScore % binWidth !== 0 ? binWidth - (maxScore % binWidth) : 0) || bins[bins.length - 1].x1;
        }
        
        // Calculate median score
        const median = d3.median(scores, d => d.score);
        
        return {judge, bins, median};
    });

    // Select container for histograms
    const container = d3.select("#histograms");

    // Dimensions for each histogram SVG
    const width = 300;
    const height = 200;
    const margin = {top: 20, right: 20, bottom: 30, left: 40};

    // Common x-scale for all histograms
    const x = d3.scaleLinear()
        .domain([minScore, maxScore])
        .range([margin.left, width - margin.right]);

    // Common y-scale max
    const maxY = d3.max(histograms.flatMap(h => h.bins.map(b => b.length)));
    const y = d3.scaleLinear()
        .domain([0, maxY]).nice()
        .range([height - margin.bottom, margin.top]);

    // Axis generators
    const xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d3.format(".1f")));

    const yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    // Map to store bar selections for each judge for easy updating
    const judgeBars = {};

    // Render each histogram
    histograms.forEach(hist => {
        // Create div for this judge's histogram
        const div = container.append("div")
            .attr("class", "judge-histogram");

        // Add title with median
        div.append("h3")
            .text(`${hist.judge} - Median: ${hist.median.toFixed(3)}`);

        // Create SVG
        const svg = div.append("svg")
            .attr("width", width)
            .attr("height", height);

        // Add axes
        svg.append("g").call(xAxis);
        svg.append("g").call(yAxis);

        // Add bars
        const barGroup = svg.append("g");
        const bars = barGroup.selectAll("rect")
            .data(hist.bins)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.x0) + 1)
            .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 2))
            .attr("y", d => y(d.length))
            .attr("height", d => y(0) - y(d.length));

        // Store the bars selection for this judge
        judgeBars[hist.judge] = bars;

        // Add interactivity: hover to highlight corresponding bars in other histograms
        bars.on("mouseover", function(event, hoveredBin) {
            const currentJudge = hist.judge;
            const parejas = hoveredBin.map(d => d.pareja);

            // For each other judge's histogram
            histograms.forEach(otherHist => {
                if (otherHist.judge === currentJudge) return;

                // Collect bins to highlight
                const highlights = new Set();
                parejas.forEach(p => {
                    const score = parejaScores[p][judgeIndices[otherHist.judge]];
                    // Find the bin containing this score (with edge handling for max)
                    const targetBin = otherHist.bins.find(b => b.x0 <= score && score < b.x1) ||
                        (score === maxScore && otherHist.bins.find(b => b.x0 <= score && score <= b.x1));
                    if (targetBin) {
                        highlights.add(targetBin);
                    }
                });

                // Update classes on the other judge's bars
                judgeBars[otherHist.judge].classed("highlight", d => highlights.has(d));
            });
        }).on("mouseout", function() {
            // Clear highlights on mouseout
            histograms.forEach(otherHist => {
                if (otherHist.judge === hist.judge) return;
                judgeBars[otherHist.judge].classed("highlight", false);
            });
        });
    });
});