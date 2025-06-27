const fs = require('fs');
const path = require('path');

async function githubCommand(sock, chatId, message) {
    const repoInfo = `*🤖 Arslan-Ai*

*📂 GitHub Repository:*
https://github.com/Arslan-MD/Arslan-Ai

*📢 Official Channel:*
https://youtube.com/@arslanmdofficial

_Star ⭐ the repository if you like the bot!_`;

    try {
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');

        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: repoInfo
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                text: repoInfo
            }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in github command:', error);
        await sock.sendMessage(chatId, {
            text: repoInfo
        });
    }
}

module.exports = githubCommand;
