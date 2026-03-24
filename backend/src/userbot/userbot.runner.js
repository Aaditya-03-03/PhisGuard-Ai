import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import input from 'input'; 
import { startUserbotListener } from './userbot.service.js';

let isBooting = false;

export async function startUserbot() {
    if (isBooting) return;
    isBooting = true;

    const apiId = parseInt(process.env.TELEGRAM_API_ID) || 0;
    const apiHash = process.env.TELEGRAM_API_HASH || '';
    const sessionStr = (process.env.TELEGRAM_SESSION || '').trim();

    if (!apiId || !apiHash) {
        console.warn('⚠️ [Userbot] Skipping init: TELEGRAM_API_ID and TELEGRAM_API_HASH not configured.');
        isBooting = false;
        return;
    }

    console.log('[Userbot] Initializing MTProto client...');

    const stringSession = new StringSession(sessionStr);

    const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5, // Resilience rule: auto-reconnect strategy
    });

    try {
        // Automatically connects using session OR prompts securely in CLI
        await client.start({
            phoneNumber: async () => await input.text('Please enter your Telegram number (e.g., +1234567890): '),
            password: async () => await input.text('Please enter your 2FA password (if applicable): '),
            phoneCode: async () => await input.text('Please enter the OTP you received in Telegram: '),
            onError: (err) => console.error('[Userbot] auth error:', err.message),
        });

        console.log('✅ [Userbot] Connected to Telegram MTProto securely!');
        
        // Emits once during first CLI setup, NEVER logged again
        const newSessionString = client.session.save();
        if (newSessionString !== sessionStr) {
            console.log('\n\n=============================================================');
            console.log('🎉 INITIAL SETUP COMPLETE!');
            console.log('Copy the string below and save it as TELEGRAM_SESSION in your .env file:');
            console.log(newSessionString);
            console.log('=============================================================\n\n');
        }

        // Attach listeners and start message queue
        startUserbotListener(client, newSessionString);
        
    } catch (e) {
        console.error('[Userbot] Failed to start client:', e.message);
    } finally {
        isBooting = false;
    }
}
