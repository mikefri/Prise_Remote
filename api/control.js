import { TuyaContext } from '@tuya/tuya-connector-nodejs';

export default async function handler(req, res) {
    // Headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { action, accessId, accessSecret, deviceId, code, value } = req.body || {};

    if (!accessId || !accessSecret) {
        return res.status(400).json({ success: false, msg: "Clés API manquantes." });
    }

    const tuya = new TuyaContext({
        baseUrl: 'https://openapi.tuyaeu.com',
        accessKey: accessId,
        secretKey: accessSecret,
    });

    try {
        let response;
        switch (action) {
            case 'listDevices':
                const rawList = await tuya.request({
                    path: '/v1.0/iot-01/associated-users/devices?size=50',
                    method: 'GET'
                });
                
                const devices = rawList.result.devices || rawList.result || [];
                // Filtrage selon tes instructions (Calex, Light, et catégories Tuya)
                const lightsOnly = devices.filter(d => 
                    ['dj', 'dd', 'fwl', 'tdq'].includes(d.category) || 
                    d.name.toLowerCase().includes('calex') || 
                    d.name.toLowerCase().includes('light')
                );
                response = { success: true, result: lightsOnly };
                break;

            case 'send':
                response = await tuya.request({
                    path: `/v1.0/devices/${deviceId}/commands`,
                    method: 'POST',
                    body: { "commands": [{ "code": code, "value": value }] }
                });
                break;

            default:
                response = { success: false, msg: "Action non supportée" };
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
