// Import existing SBC configurations
const { sbcConfigs } = require('./sip-config.js');

// Initialize configuration when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadConfig();
});

// Load configuration based on selected SBC type
function loadConfig() {
    const sbcType = document.getElementById('sbc-type').value;
    const config = sbcConfigs[sbcType];

    if (!config) return;

    // Server Configuration
    document.getElementById('ws-url').value = config.sipServer.wsUrl;
    document.getElementById('domain').value = config.sipServer.domain;
    document.getElementById('outbound-proxy').value = config.sipServer.outboundProxy;
    document.getElementById('port').value = config.sipServer.port;

    // ICE Configuration
    if (config.iceServers && config.iceServers.length > 0) {
        document.getElementById('stun-url').value = config.iceServers[0].urls;
        document.getElementById('stun-username').value = config.iceServers[0].username;
        document.getElementById('stun-credential').value = config.iceServers[0].credential;
    }

    // Media Configuration
    document.getElementById('audio-enabled').checked = config.media.audio.enabled;
    document.getElementById('video-enabled').checked = config.media.video.enabled;
    document.getElementById('dtmf-type').value = config.media.audio.dtmfType;

    // Codecs
    const codecs = config.media.audio.codecs;
    document.getElementById('codec-pcmu').checked = codecs.includes('PCMU');
    document.getElementById('codec-pcma').checked = codecs.includes('PCMA');
    document.getElementById('codec-opus').checked = codecs.includes('opus');

    // Security Configuration
    document.getElementById('secure').checked = config.security.secure;
    document.getElementById('verify-cert').checked = config.security.verifyPeerCertificate;
    document.getElementById('dtls-enabled').checked = config.security.dtlsEnabled;
}

// Save configuration
function saveConfig() {
    const sbcType = document.getElementById('sbc-type').value;
    
    const newConfig = {
        sipServer: {
            wsUrl: document.getElementById('ws-url').value,
            domain: document.getElementById('domain').value,
            outboundProxy: document.getElementById('outbound-proxy').value,
            port: parseInt(document.getElementById('port').value)
        },
        iceServers: [{
            urls: document.getElementById('stun-url').value,
            username: document.getElementById('stun-username').value,
            credential: document.getElementById('stun-credential').value
        }],
        media: {
            audio: {
                enabled: document.getElementById('audio-enabled').checked,
                codecs: getSelectedCodecs(),
                dtmfType: document.getElementById('dtmf-type').value
            },
            video: {
                enabled: document.getElementById('video-enabled').checked
            }
        },
        security: {
            secure: document.getElementById('secure').checked,
            verifyPeerCertificate: document.getElementById('verify-cert').checked,
            dtlsEnabled: document.getElementById('dtls-enabled').checked
        }
    };

    // Update the configuration
    sbcConfigs[sbcType] = newConfig;

    // Show success message
    alert('Configuration saved successfully!');
}

// Get selected audio codecs
function getSelectedCodecs() {
    const codecs = [];
    if (document.getElementById('codec-pcmu').checked) codecs.push('PCMU');
    if (document.getElementById('codec-pcma').checked) codecs.push('PCMA');
    if (document.getElementById('codec-opus').checked) codecs.push('opus');
    return codecs;
}

// Reset configuration form
function resetConfig() {
    if (confirm('Are you sure you want to reset the configuration?')) {
        document.getElementById('sbc-type').selectedIndex = 0;
        loadConfig();
    }
}

// Add event listener for SBC type change
document.getElementById('sbc-type').addEventListener('change', loadConfig);