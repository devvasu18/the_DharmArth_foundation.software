require('dotenv').config();

async function testTunnel() {
    const url = process.env.WHATSAPP_SERVICE_URL;
    const apiKey = process.env.WHATSAPP_SERVICE_API_KEY;

    console.log(`Testing Tunnel URL: ${url}`);

    try {
        const response = await fetch(`${url}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'bypass-tunnel-reminder': 'true'
            },
            body: JSON.stringify({
                number: "919256687043",
                message: "Test message via Tunnel"
            })
        });

        console.log(`Response Status: ${response.status}`);
        const data = await response.json();
        console.log("Response Data:", data);

        if (response.ok) {
            console.log("✅ Tunnel is working and communicating with WhatsApp Service!");
        } else {
            console.log("❌ Service responded with an error. Check API Key or Service logs.");
        }
    } catch (error) {
        console.error("❌ Failed to connect via Tunnel:", error.message);
    }
}

testTunnel();
