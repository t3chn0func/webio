// SBC Configuration Factory
const sbcConfigs = {
    // Cisco CUBE Configuration
    cube: {
        sipServer: {
            wsUrl: 'wss://ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com:8443',
        domain: 'ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com',
        outboundProxy: 'ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com',
            port: 8443
        },
        iceServers: [{
            urls: 'stun:stun.ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com:3478',
            username: 'cube_stun_user',
            credential: 'cube_stun_pass'
        }],
        media: {
            audio: {
                enabled: true,
                codecs: ['PCMU', 'PCMA', 'opus'],
                dtmfType: 'info'
            },
            video: { enabled: false }
        },
        security: {
            secure: true,
            verifyPeerCertificate: true,
            dtlsEnabled: true
        }
    },

    // Ribbon SBC Configuration
    ribbon: {
        sipServer: {
            wsUrl: 'wss://ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com:7443',
        domain: 'ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com',
        outboundProxy: 'ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com',
            port: 7443
        },
        iceServers: [{
            urls: 'stun:stun.ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com:3478',
            username: 'ribbon_stun_user',
            credential: 'ribbon_stun_pass'
        }],
        media: {
            audio: {
                enabled: true,
                codecs: ['PCMU', 'PCMA', 'opus'],
                dtmfType: 'info'
            },
            video: { enabled: false }
        },
        security: {
            secure: true,
            verifyPeerCertificate: true,
            dtlsEnabled: true
        }
    },

    // Oracle SBC Configuration
    oracle: {
        sipServer: {
            wsUrl: 'wss://ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com:8443',
        domain: 'ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com',
        outboundProxy: 'ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com',
            port: 8443
        },
        iceServers: [{
            urls: 'stun:stun.ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com:3478',
            username: 'oracle_stun_user',
            credential: 'oracle_stun_pass'
        }],
        media: {
            audio: {
                enabled: true,
                codecs: ['PCMU', 'PCMA', 'opus'],
                dtmfType: 'info'
            },
            video: { enabled: false }
        },
        security: {
            secure: true,
            verifyPeerCertificate: true,
            dtlsEnabled: true
        }
    },

    // Avaya SBC Configuration
    avaya: {
        sipServer: {
            wsUrl: 'wss://ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com:443',
        domain: 'ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com',
        outboundProxy: 'ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com',
            port: 443
        },
        iceServers: [{
            urls: 'stun:stun.ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com:3478',
            username: 'avaya_stun_user',
            credential: 'avaya_stun_pass'
        }],
        media: {
            audio: {
                enabled: true,
                codecs: ['PCMU', 'PCMA', 'opus'],
                dtmfType: 'info'
            },
            video: { enabled: false }
        },
        security: {
            secure: true,
            verifyPeerCertificate: true,
            dtlsEnabled: true
        }
    },

    // FreePBX Configuration
    freepbx: {
        sipServer: {
            wsUrl: 'wss://ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com:8089',
        domain: 'ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com',
        outboundProxy: 'ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com',
            port: 8089
        },
        iceServers: [{
            urls: 'stun:stun.ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com:3478',
            username: 'freepbx_stun_user',
            credential: 'freepbx_stun_pass'
        }],
        media: {
            audio: {
                enabled: true,
                codecs: ['PCMU', 'PCMA', 'opus'],
                dtmfType: 'info'
            },
            video: { enabled: false }
        },
        security: {
            secure: true,
            verifyPeerCertificate: true,
            dtlsEnabled: true
        }
    },

    // Sangoma SBC Configuration
    sangoma: {
        sipServer: {
            wsUrl: 'wss://ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com:5066',
        domain: 'ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com',
        outboundProxy: 'ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com',
            port: 5066
        },
        iceServers: [{
            urls: 'stun:stun.ec2-52-221-184-153.ap-southeast-1.compute.amazonaws.com:3478',
            username: 'sangoma_stun_user',
            credential: 'sangoma_stun_pass'
        }],
        media: {
            audio: {
                enabled: true,
                codecs: ['PCMU', 'PCMA', 'opus'],
                dtmfType: 'info'
            },
            video: { enabled: false }
        },
        security: {
            secure: true,
            verifyPeerCertificate: true,
            dtlsEnabled: true
        }
    }
};

// Configuration factory function
const getSBCConfig = (sbcType) => {
    const config = sbcConfigs[sbcType.toLowerCase()];
    if (!config) {
        throw new Error(`Unsupported SBC type: ${sbcType}`);
    }
    return config;
};

// Make functions available globally for browser usage
if (typeof window !== 'undefined') {
    window.getSBCConfig = getSBCConfig;
    window.sbcConfigs = sbcConfigs;
} else {
    // Node.js environment
    module.exports = { getSBCConfig, sbcConfigs };
}