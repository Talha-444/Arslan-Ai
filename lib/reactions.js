const fs = require('fs');
const path = require('path');
const { Boom } = require('@hapi/boom');

// 🔥 ULTRA PRO MAX CONFIG
const CONFIG_PATH = path.join(__dirname, '../data/autoreact.json');
const DEFAULT_CONFIG = {
    enabled: true,
    mode: 'smart', // smart/random/fixed
    emoji: '❤️', // default for fixed mode
    whitelist: [], // numbers to always react to
    blacklist: [] // numbers to never react to
};

// 🌟 PREMIUM EMOJI SETS
const EMOJI_SETS = {
    standard: ['✨', '⚡', '🔥', '💥', '🌟', '🎯', '🚀', '🎉', '💫'],
    hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍'],
    stars: ['⭐', '🌟', '🌠', '💫', '✨', '☄️', '🌌', '🔭', '🪐']
};

// ✅ INITIALIZE CONFIG
function initConfig() {
    if (!fs.existsSync(CONFIG_PATH)) {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
    }
    try {
        const currentConfig = JSON.parse(fs.readFileSync(CONFIG_PATH));
        return { ...DEFAULT_CONFIG, ...currentConfig };
    } catch (err) {
        console.error('[ULTRA PRO MAX] Config load failed, using defaults:', err);
        return DEFAULT_CONFIG;
    }
}

// 💎 REACTION MANAGER CLASS
class ReactionMaster {
    constructor() {
        this.config = initConfig();
        this.currentSet = EMOJI_SETS.standard;
    }

    // 🔄 SAVE CONFIG
    async saveConfig() {
        try {
            await fs.promises.writeFile(CONFIG_PATH, JSON.stringify(this.config, null, 2));
        } catch (err) {
            console.error('[ULTRA PRO MAX] Config save error:', err);
            throw new Boom('Failed to save config', { statusCode: 500 });
        }
    }

    // 🎯 GET SMART EMOJI
    getSmartEmoji(message) {
        if (!message?.message) return this.config.emoji;
        
        // AI-based reaction selection (placeholder)
        const msgText = message.message.conversation || '';
        if (msgText.includes('?')) return '🤔';
        if (msgText.includes('!')) return '❗';
        if (msgText.length > 50) return '📝';
        
        return this.currentSet[Math.floor(Math.random() * this.currentSet.length)];
    }

    // ✨ GET REACTION EMOJI
    getReactionEmoji(message) {
        switch (this.config.mode) {
            case 'fixed': return this.config.emoji;
            case 'smart': return this.getSmartEmoji(message);
            case 'random': 
            default: 
                return this.currentSet[Math.floor(Math.random() * this.currentSet.length)];
        }
    }

    // 🚀 ADD REACTION
    async addReaction(sock, message) {
        if (!this.config.enabled || !message?.key) return false;
        
        const sender = message.key.remoteJid;
        if (this.config.blacklist.includes(sender)) return false;
        if (this.config.whitelist.length > 0 && !this.config.whitelist.includes(sender)) return false;

        try {
            const emoji = this.getReactionEmoji(message);
            await sock.sendMessage(sender, {
                react: { text: emoji, key: message.key }
            });
            return true;
        } catch (err) {
            console.error('[ULTRA PRO MAX] Reaction failed:', err);
            return false;
        }
    }

    // 🎛️ HANDLE COMMAND
    async handleCommand(sock, chatId, message, isOwner) {
        if (!isOwner) {
            await sock.sendMessage(chatId, { 
                text: '🚫 *Owner Only Command*',
                quoted: message 
            });
            return;
        }

        const text = message.message?.conversation || '';
        const args = text.trim().split(' ');

        try {
            switch (args[1]?.toLowerCase()) {
                case 'on':
                    this.config.enabled = true;
                    await this.saveConfig();
                    await sock.sendMessage(chatId, {
                        text: '✅ *Auto-Reaction Activated*\nMode: ' + this.config.mode.toUpperCase(),
                        quoted: message
                    });
                    break;

                case 'off':
                    this.config.enabled = false;
                    await this.saveConfig();
                    await sock.sendMessage(chatId, {
                        text: '❌ *Auto-Reaction Deactivated*',
                        quoted: message
                    });
                    break;

                case 'mode':
                    if (['smart', 'random', 'fixed'].includes(args[2])) {
                        this.config.mode = args[2];
                        await this.saveConfig();
                        await sock.sendMessage(chatId, {
                            text: `♻️ *Mode Changed to:* ${args[2].toUpperCase()}`,
                            quoted: message
                        });
                    } else {
                        await sock.sendMessage(chatId, {
                            text: `📛 *Invalid Mode*\nAvailable: SMART, RANDOM, FIXED\nCurrent: ${this.config.mode.toUpperCase()}`,
                            quoted: message
                        });
                    }
                    break;

                case 'set':
                    if (args[2] && EMOJI_SETS[args[2]]) {
                        this.currentSet = EMOJI_SETS[args[2]];
                        await sock.sendMessage(chatId, {
                            text: `🎨 *Emoji Set Changed to:* ${args[2].toUpperCase()}`,
                            quoted: message
                        });
                    } else {
                        const availableSets = Object.keys(EMOJI_SETS).join(', ');
                        await sock.sendMessage(chatId, {
                            text: `🛑 *Invalid Emoji Set*\nAvailable: ${availableSets}`,
                            quoted: message
                        });
                    }
                    break;

                default:
                    const status = this.config.enabled ? '🟢 ON' : '🔴 OFF';
                    await sock.sendMessage(chatId, {
                        text: `⚙️ *Auto-Reaction Status*\n\n` +
                              `Status: ${status}\n` +
                              `Mode: ${this.config.mode.toUpperCase()}\n` +
                              `Current Set: ${this.currentSet[0]}...\n\n` +
                              `📌 *Commands:*\n` +
                              `.autoreact on/off\n` +
                              `.autoreact mode [smart/random/fixed]\n` +
                              `.autoreact set [standard/hearts/stars]`,
                        quoted: message
                    });
            }
        } catch (err) {
            console.error('[ULTRA PRO MAX] Command error:', err);
            await sock.sendMessage(chatId, {
                text: '💥 *Command Failed*\n' + err.message,
                quoted: message
            });
        }
    }
}

// 💫 EXPORT SINGLETON INSTANCE
const reactionMaster = new ReactionMaster();
module.exports = {
    addReaction: (sock, msg) => reactionMaster.addReaction(sock, msg),
    handleCommand: (sock, chatId, msg, isOwner) => 
        reactionMaster.handleCommand(sock, chatId, msg, isOwner)
};
