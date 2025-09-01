# Judge Scores Histograms

An interactive website that visualizes the distribution of judge scores from the Tango 2025 Pista Semi CSV data.

## Overview

This project creates histograms for each judge's scores, showing the frequency distribution of scores from 7 to 10. It includes interactive features like:
- Selecting a specific couple to highlight their scores on the histograms.
- Filtering the data by a cutoff (top N rows based on the CSV order).
- Hovering over bars to highlight corresponding score bins across all histograms.
- Median score lines on each histogram.

The site is built with HTML, CSS, JavaScript, and D3.js (loaded via CDN).

## Files
- `index.html`: Main HTML file.
- `index.js`: JavaScript for loading data, creating histograms, and handling interactions.
- `styles.css`: CSS for styling.
- `tango-2025-pista-semi.csv`: Data file with judge scores.
- `README.md`: This file.
- (Optional) `help.html`: A separate help page (linked from index.html).

## Setup and Hosting
1. Clone the repository.
2. Open `index.html` in a browser for local viewing.
3. For hosting: Deploy via GitHub Pages (as described in previous instructions).

## Usage
- **Pareja Dropdown**: Select a couple to highlight their scores (green bars) on each histogram.
- **Data Cutoff Dropdown**: Limit the data to the top N rows (e.g., top 5, 10, etc.).
- **Hover Interaction**: Mouse over a bar in any histogram to highlight the same score bin in all others (orange).
- **Median Line**: Red dashed line shows the median score for that judge's filtered data.

## Dependencies
- D3.js (v7) via CDN: No local installation needed.

## Development
- Edit `index.js` for logic changes.
- Run locally by opening `index.html` in a browser (ensure CSV is in the same directory).

## License
MIT License (or specify your own).
