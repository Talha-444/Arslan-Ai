const os = require('os');
const process = require('process');

function formatUptime(seconds) {
    const pad = (s) => (s < 10 ? '0' + s : s);
    const hrs = pad(Math.floor(seconds / 3600));
    const mins = pad(Math.floor((seconds % 3600) / 60));
    const secs = pad(Math.floor(seconds % 60));
    return `${hrs}:${mins}:${secs}`;
}

async function aliveCommand(sock, chatId, message) {
    try {
        const botName = global.botname || 'Arslan-Ai';
        const version = global.version || '2.0.2';
        const owner = global.botOwner || 'ArslanMD';
        const mode = global.commandMode || 'public';
        const uptime = formatUptime(process.uptime());

        const content = `
🤖 *${botName} is Alive!*

📦 *Version:* ${version}
👑 *Owner:* ${owner}
🌐 *Mode:* ${mode}
💻 *Platform:* ${os.platform().toUpperCase()}
⏱️ *Uptime:* ${uptime}
        `.trim();

        await sock.sendMessage(chatId, {
            text: content,
            footer: '🔥 Arslan-MD | MultiBot System',
            templateButtons: [
                {
                    index: 1,
                    quickReplyButton: {
                        displayText: '📜 Show Menu',
                        id: '.menu'
                    }
                },
                {
                    index: 2,
                    quickReplyButton: {
                        displayText: '🏓 Ping Bot',
                        id: '.ping'
                    }
                },
                {
                    index: 3,
                    urlButton: {
                        displayText: '🌐 GitHub Repo',
                        url: 'https://github.com/Arslan-MD/Arslan-Ai'
                    }
                }
            ]
        }, { quoted: message });

    } catch (err) {
        console.error("❌ Error in .alive:", err);
        await sock.sendMessage(chatId, {
            text: "⚠️ Arslan-MD is alive, but button failed to show."
        }, { quoted: message });
    }
}

module.exports = aliveCommand;
