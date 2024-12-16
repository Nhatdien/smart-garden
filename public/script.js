// Fetch and display sensor data
async function fetchData() {
    const res = await fetch('/current-data');
    const data = await res.json();
  
    // Update gauges
    document.getElementById('temperature-gauge').innerText = `${data.temperature?.[data.temperature?.length - 2] || `N/A`} °C`;
    document.getElementById('humidity-gauge').innerText = `${data.humidity[data.humidity.length - 2] || `N/A`} %`;
    document.getElementById('last-update').innerText = data.timestamps[0] || 'N/A';
  
    renderChart('lightChart', 'Light Intensity', data.light);
    renderChart('distanceChart', 'Distance', data.distance);
}
  
// Store chart instances
const charts = {};

// Render charts using Chart.js
function renderChart(canvasId, label, dataPoints) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Destroy existing chart instance if it exists
    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }

    // Extract timestamps and values
    const timestamps = dataPoints.map(dp => dp.timestamps[0]);
    const values = dataPoints.map(dp => dp.values[0]);

    // Create new chart instance
    charts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timestamps,
            datasets: [{
                label: label,
                data: values,
                borderColor: 'blue',
                fill: false
            }]
        },
        options: { responsive: true }
    });
}
  
// Submit irrigation schedule
document.getElementById('scheduler-form').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const schedule = {
        time: document.getElementById('startTime').value + ':00',
        // interval: document.getElementById('interval').value,
        duration: document.getElementById('duration').value
    };
  
    console.log(schedule);
    const res = await fetch('/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule)
    });
  
    const message = await res.text();
    alert(message);
});
  
// Initial load
fetchData();
setInterval(fetchData, 5000); // Update every 5 seconds
