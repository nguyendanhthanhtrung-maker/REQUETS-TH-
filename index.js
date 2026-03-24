const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.json());

// Lấy thông tin từ môi trường Render
const RENDER_ACTOR_ID = process.env.FB_ACTOR_ID;
const RENDER_FB_DTSG = process.env.FB_DTSG;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

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
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        return { id, status: 'Thành công ✅' };
    } catch (error) {
        return { id, status: 'Thất bại ❌' };
    }
}

app.post('/api/run', async (req, res) => {
    // Nếu trong body không gửi lên, sẽ lấy từ Render Environment
    const actor_id = req.body.actor_id || RENDER_ACTOR_ID;
    const fb_dtsg = req.body.fb_dtsg || RENDER_FB_DTSG;
    const idsString = req.body.ids;

    if (!actor_id || !fb_dtsg) {
        return res.status(400).json({ error: "Thiếu actor_id hoặc fb_dtsg trên Render Environment!" });
    }

    const listIds = idsString.split(/[\s,;]+/).filter(id => id.length > 0);
    
    // Phản hồi ngay để tránh treo web
    res.json({ message: `Đang bắt đầu xử lý ${listIds.length} ID...` });

    for (const id of listIds) {
        const result = await sendAppeal(id, fb_dtsg, actor_id);
        console.log(`[LOG] ID: ${result.id} -> ${result.status}`);
        await new Promise(resolve => setTimeout(resolve, 3000)); // Nghỉ 3 giây
    }
    console.log("=== HOÀN TẤT TIẾN TRÌNH ===");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
