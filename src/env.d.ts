/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly PUBLIC_VERCEL_ANALYTICS_ID: string;
	readonly SMTP_HOST: string;
	readonly SMTP_PORT: string;
	readonly SMTP_USER: string;
	readonly SMTP_PASS: string;
	readonly FROM_EMAIL: string;
	readonly RECIPIENT_EMAIL: string;
	readonly SISTEMA_USER: string;
	readonly SISTEMA_PASSWORD: string;
	readonly SISTEMA_SECRET: string;
	readonly GITHUB_TOKEN: string;
	readonly GITHUB_REPO: string;
	readonly GITHUB_BRANCH: string;
	readonly GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
	readonly GOOGLE_PRIVATE_KEY: string;
	readonly GOOGLE_SHEET_ID: string;
	readonly GOOGLE_SHEET_NAME: string;
	readonly FIREBASE_PROJECT_ID: string;
	readonly FIREBASE_SERVICE_ACCOUNT: string;
	readonly FIREBASE_CLIENT_EMAIL: string;
	readonly FIREBASE_PRIVATE_KEY: string;
	readonly TELEGRAM_BOT_TOKEN: string;
	readonly TELEGRAM_CHAT_ID: string;
	readonly TELEGRAM_API_ID: string;
	readonly TELEGRAM_API_HASH: string;
	readonly TELEGRAM_SESSION: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
