// Dashboard Data Management
let dashboardData = {
    activeCalls: 0,
    totalCalls: 0,
    successRate: 0,
    callDurations: [],
    errorRates: [],
    alerts: []
};

// Initialize Charts
let callDurationChart;
let errorRateChart;

document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    refreshDashboard();
    // Auto refresh every 30 seconds
    setInterval(refreshDashboard, 30000);
});

function initializeCharts() {
    // Call Duration Chart
    const callDurationCtx = document.getElementById('callDurationChart').getContext('2d');
    callDurationChart = new Chart(callDurationCtx, {
        type: 'line',
        data: {
            labels: generateTimeLabels(12),
            datasets: [{
                label: 'Average Call Duration (minutes)',
                data: [],
                borderColor: '#007bff',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Error Rate Chart
    const errorRateCtx = document.getElementById('errorRateChart').getContext('2d');
    errorRateChart = new Chart(errorRateCtx, {
        type: 'bar',
        data: {
            labels: generateTimeLabels(6),
            datasets: [{
                label: 'Error Rate (%)',
                data: [],
                backgroundColor: '#dc3545'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function generateTimeLabels(hours) {
    const labels = [];
    const now = new Date();
    for (let i = hours - 1; i >= 0; i--) {
        const time = new Date(now - i * 3600000);
        labels.push(time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    }
    return labels;
}

async function refreshDashboard() {
    try {
        // Fetch updated statistics
        const response = await fetch('/api/call-statistics');
        const data = await response.json();
        updateDashboardData(data);
        updateCharts();
        updateAlerts();
    } catch (error) {
        console.error('Failed to refresh dashboard:', error);
        addAlert({
            type: 'error',
            message: 'Failed to update dashboard data',
            timestamp: new Date()
        });
    }
}

function updateDashboardData(data) {
    dashboardData = { ...dashboardData, ...data };
    
    // Update statistics display
    document.getElementById('active-calls').textContent = dashboardData.activeCalls;
    document.getElementById('total-calls').textContent = dashboardData.totalCalls;
    document.getElementById('success-rate').textContent = `${dashboardData.successRate}%`;
}

function updateCharts() {
    // Update Call Duration Chart
    callDurationChart.data.datasets[0].data = dashboardData.callDurations;
    callDurationChart.update();

    // Update Error Rate Chart
    errorRateChart.data.datasets[0].data = dashboardData.errorRates;
    errorRateChart.update();
}

function updateAlerts() {
    const alertList = document.getElementById('alert-list');
    alertList.innerHTML = ''; // Clear existing alerts

    dashboardData.alerts.slice(0, 10).forEach(alert => {
        const alertElement = createAlertElement(alert);
        alertList.appendChild(alertElement);
    });
}

function createAlertElement(alert) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert-item alert-${alert.type}`;
    
    const timestamp = new Date(alert.timestamp).toLocaleString();
    alertDiv.innerHTML = `
        <div class="alert-timestamp">${timestamp}</div>
        <div class="alert-message">${alert.message}</div>
    `;
    
    return alertDiv;
}

function addAlert(alert) {
    dashboardData.alerts.unshift(alert);
    if (dashboardData.alerts.length > 50) {
        dashboardData.alerts.pop(); // Keep only last 50 alerts
    }
    updateAlerts();
}

// WebSocket connection for real-time updates
const ws = new WebSocket(`ws://${window.location.host}`);

ws.onmessage = (event) => {
    const update = JSON.parse(event.data);
    
    if (update.type === 'stats') {
        updateDashboardData(update.data);
        updateCharts();
    } else if (update.type === 'alert') {
        addAlert(update.data);
    }
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    addAlert({
        type: 'error',
        message: 'Lost connection to server. Retrying...',
        timestamp: new Date()
    });
};

ws.onclose = () => {
    addAlert({
        type: 'warning',
        message: 'Connection closed. Attempting to reconnect...',
        timestamp: new Date()
    });
    // Attempt to reconnect after 5 seconds
    setTimeout(() => {
        window.location.reload();
    }, 5000);
};