# Production configuration reference

Set the following values through the hosting platform’s secret-management UI. Keep live credentials out of the repository and out of browser-delivered code.

| Variable | Required for | Purpose |
| --- | --- | --- |
| `JWT_SECRET` | Every production deployment | Signs server-side application tokens. Use a long random value. |
| `MONGODB_URI` | MongoDB deployment profile | Connection string for an institute-owned MongoDB cluster. |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary uploads | Target Cloudinary cloud name. |
| `CLOUDINARY_API_KEY` | Cloudinary uploads | Server-side upload signing key. |
| `CLOUDINARY_API_SECRET` | Cloudinary uploads | Server-side upload signing secret. |
| `JAZZCASH_MERCHANT_ID` | JazzCash payments | Institute merchant identifier. |
| `JAZZCASH_PASSWORD` | JazzCash payments | Merchant password supplied by JazzCash. |
| `JAZZCASH_INTEGRITY_SALT` | JazzCash payments | Merchant integrity value used for server-side request verification. |
| `JAZZCASH_RETURN_URL` | JazzCash payments | Public callback/return URL registered with the merchant account. |
| `EASYPAISA_STORE_ID` | Easypaisa payments | Institute store identifier. |
| `EASYPAISA_HASH_KEY` | Easypaisa payments | Server-side merchant verification key. |
| `EASYPAISA_RETURN_URL` | Easypaisa payments | Public callback/return URL registered with the merchant account. |
| `BANK_TRANSFER_NAME` | Bank transfer | Bank display name for student instructions. |
| `BANK_TRANSFER_ACCOUNT_TITLE` | Bank transfer | Approved beneficiary account title. |
| `BANK_TRANSFER_ACCOUNT_NUMBER` | Bank transfer | Approved account number or IBAN. |
| `REMINDER_EMAIL_FROM` and `REMINDER_EMAIL_API_KEY` | Email reminders | Approved sender identity and mail delivery credential. |
| `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp reminders | Approved WhatsApp Business delivery configuration. |
