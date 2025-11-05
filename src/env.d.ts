/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly PUBLIC_VERCEL_ANALYTICS_ID: string;
	readonly SMTP_HOST: string;
	readonly SMTP_PORT: string;
	readonly SMTP_USER: string;
	readonly SMTP_PASS: string;
	readonly FROM_EMAIL: string;
	readonly RECIPIENT_EMAIL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
