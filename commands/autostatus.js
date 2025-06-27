const fs = require('fs');
const path = require('path');

// 🔐 File path for config
const configPath = path.join(__dirname, '../data/autoStatus.json');

// 📌 Initialize config if missing
if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({
        enabled: false,
        reactEmoji: "❤️",
        notifyOwner: true,
        blacklist: []
    }, null, 2));
}

// 🧠 Safe config loader with fallback
function loadConfig() {
    try {
        const file = fs.readFileSync(configPath);
        const data = JSON.parse(file);
        return {
            enabled: false,
            reactEmoji: "❤️",
            notifyOwner: true,
            blacklist: [],
            ...data
        };
    } catch (err) {
        console.error("⚠️ Failed to load autoStatus.json:", err.message);
        return {
            enabled: false,
            reactEmoji: "❤️",
            notifyOwner: true,
            blacklist: []
        };
    }
}

// 🔄 AutoStatus Command Handler
async function autoStatusCommand(sock, chatId, msg, isOwner) {
    try {
        if (!isOwner) {
            return await sock.sendMessage(chatId, {
                text: '🚫 Only *Bot Owner* can use this command!',
                react: { text: "❌", key: msg.key }
            });
        }

        const text = msg.message?.conversation || '';
        const args = text.trim().split(' ').slice(1);
        let config = loadConfig();

        // Show settings
        if (args.length === 0) {
            const status = config.enabled ? '🟢 Enabled' : '🔴 Disabled';
            const reaction = config.reactEmoji || 'None';
            return await sock.sendMessage(chatId, {
                text: `🧠 *AutoStatus Settings*\n\n` +
                      `Status: ${status}\n` +
                      `Reaction: ${reaction}\n` +
                      `Notify Owner: ${config.notifyOwner ? 'Yes' : 'No'}\n` +
                      `Blacklisted: ${(config.blacklist || []).length}\n\n` +
                      `📌 Commands:\n` +
                      `.autostatus on/off\n` +
                      `.autostatus react ❤️\n` +
                      `.autostatus notify on/off\n` +
                      `.autostatus blacklist add/remove @user`
            });
        }

        const sub = args[0].toLowerCase();

        if (sub === 'on' || sub === 'off') {
            config.enabled = sub === 'on';
        } else if (sub === 'react' && args[1]) {
            config.reactEmoji = args[1];
        } else if (sub === 'notify' && args[1]) {
            config.notifyOwner = args[1] === 'on';
        } else if (sub === 'blacklist' && args[1] && args[2]) {
            const jid = args[2].replace('@', '') + '@s.whatsapp.net';
            if (args[1] === 'add') {
                if (!config.blacklist.includes(jid)) config.blacklist.push(jid);
            } else if (args[1] === 'remove') {
                config.blacklist = config.blacklist.filter(x => x !== jid);
            }
        } else {
            return await sock.sendMessage(chatId, {
                text: '❓ Invalid command!\nUse `.autostatus` for help.',
                react: { text: "❓", key: msg.key }
            });
        }

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        return await sock.sendMessage(chatId, {
            text: `✅ *AutoStatus Updated*`,
            react: { text: "✅", key: msg.key }
        });

    } catch (err) {
        console.error("❌ AutoStatusCommand Error:", err.message);
        await sock.sendMessage(chatId, {
            text: `❌ Error: ${err.message}`,
            react: { text: "⚠️", key: msg.key }
        });
    }
}

// 👁️ Status Reaction Handler
async function handleStatusUpdate(sock, status) {
    try {
        const config = loadConfig();
        if (!config.enabled) return;

        const key = status.key || status.messages?.[0]?.key;
        if (!key || key.remoteJid !== 'status@broadcast') return;

        const sender = key.participant || key.remoteJid;

        if ((config.blacklist || []).includes(sender)) {
            console.log(`🚫 Ignored blacklisted user: ${sender}`);
            return;
        }

        await sock.readMessages([key]);

        if (config.reactEmoji) {
            await sock.sendMessage(key.remoteJid, {
                react: { text: config.reactEmoji, key }
            });
        }

        if (config.notifyOwner && sock.user?.id) {
            await sock.sendMessage(sock.user.id, {
                text: `👁️ Viewed status from @${sender.split('@')[0]}`,
                mentions: [sender]
            });
        }

        console.log(`✅ AutoStatus reacted to ${sender}`);

    } catch (err) {
        console.error("❌ handleStatusUpdate Error:", err.message);
    }
}

module.exports = {
    autoStatusCommand,
    handleStatusUpdate
};
