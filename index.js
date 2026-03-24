const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.json());

// Lấy biến từ cấu hình Render Settings -> Environment
const ACTOR_ID = process.env.FB_ACTOR_ID;
const FB_DTSG = process.env.FB_DTSG;

// 1. Endpoint Health Check (Để ping giữ server sống)
app.get('/health', (req, res) => {
    res.status(200).send('OK - Server is alive!');
});

// 2. Trang chủ hiển thị giao diện
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Hàm gửi lệnh kháng nghị sang Facebook
async function sendAppeal(id, fb_dtsg, actor_id) {
    const params = new URLSearchParams({
        av: actor_id,
        fb_dtsg: fb_dtsg,
        fb_api_caller_class: 'RelayModern',
        fb_api_req_friendly_name: 'useIXSupportInboxItemActionMutation',
        doc_id: '24199358732986612',
        variables: JSON.stringify({
            support_inbox_item_action_name: 'APPEAL_REPORT_DECISION',
            support_inbox_item_id: id,
        }),
    });

    try {
        await axios.post('https://www.facebook.com/api/graphql/', params.toString(), {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        return { id, success: true };
    } catch (error) {
        return { id, success: false };
    }
}

// 3. API xử lý kháng nghị
app.post('/api/run', async (req, res) => {
    const { ids } = req.body;

    if (!ACTOR_ID || !FB_DTSG) {
        return res.status(500).json({ error: "Chưa cấu hình FB_ACTOR_ID/FB_DTSG trên Render Environment" });
    }

    const listIds = ids.split(/[\s,;]+/).filter(id => id.length > 5);
    
    res.json({ message: `Đang xử lý ${listIds.length} ID ngầm. Hãy kiểm tra tab LOGS trên Render.` });

    for (const id of listIds) {
        const result = await sendAppeal(id, FB_DTSG, ACTOR_ID);
        console.log(`${result.success ? '✅' : '❌'} ID: ${id}`);
        // Nghỉ 3 giây để an toàn
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    console.log("=== HOÀN TẤT ===");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại port ${PORT}`);
});
