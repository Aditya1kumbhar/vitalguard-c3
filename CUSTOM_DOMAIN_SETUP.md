# VitalGuard C3: Custom Domain & Production Deployment Guide

This document specifies the exact steps required to connect a custom domain to the VitalGuard C3 clinical monitor dashboard.

---

## 1. Prerequisites for Web Bluetooth on Custom Domains

The **Web Bluetooth API** (used to connect directly to the Seeed Studio XIAO ESP32-C3 band over GATT) strictly enforces the **Secure Context** specification:
1. The custom domain **MUST be served over HTTPS** with a valid TLS/SSL certificate (e.g., via Let's Encrypt or automated platform SSL).
2. The domain must not be mixed-content (all assets, fonts, and scripts must load via HTTPS).
3. Supported browsers: Google Chrome, Microsoft Edge, Brave, and Opera on Android, Windows, macOS, ChromeOS, and Linux. (Note: iOS Safari does not support the Web Bluetooth API; use Chrome on Android/Desktop or Bluefy on iOS).

---

## 2. DNS Configuration Options

Depending on your hosting provider (Vercel, Cloudflare Pages, AWS Amplify, Netlify, or self-hosted Nginx/Docker), configure your DNS records at your registrar (e.g., Cloudflare, Namecheap, GoDaddy):

### Option A: Apex Domain (e.g., `vitalguard.com`)
| Type | Host / Name | Target / Value | TTL |
| :--- | :--- | :--- | :--- |
| **A** | `@` | `76.76.21.21` (or your static server IP) | Auto / 300 |
| **A** | `@` | `76.76.21.22` (secondary if provided) | Auto / 300 |

### Option B: Subdomain (e.g., `monitor.vitalguard.com` or `app.vitalguard.com`)
| Type | Host / Name | Target / Value | TTL |
| :--- | :--- | :--- | :--- |
| **CNAME** | `monitor` (or `app`) | `cname.vitalguard-c3.vercel.app` (or your host target) | Auto / 300 |

---

## 3. Host Platform Connection Steps

### Deploying on Vercel:
1. Navigate to **Project Settings > Domains**.
2. Enter your custom domain (e.g., `monitor.vitalguard.com`).
3. Vercel will verify DNS records and automatically issue a zero-config Let's Encrypt wildcard SSL certificate.
4. Set the domain as Primary.

### Deploying with Nginx / Self-Hosted Docker:
1. Configure Nginx reverse proxy block:
   ```nginx
   server {
       listen 80;
       server_name monitor.vitalguard.com;
       return 301 https://$host$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name monitor.vitalguard.com;

       ssl_certificate /etc/letsencrypt/live/monitor.vitalguard.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/monitor.vitalguard.com/privkey.pem;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
2. Run `certbot --nginx -d monitor.vitalguard.com` to provision automated SSL.

---

## 4. Verification Checklist

- [x] Custom domain DNS A/CNAME record points to host server
- [x] HTTPS certificate issued and active
- [x] Web Bluetooth pairing dialog functions on the domain (`navigator.bluetooth.requestDevice`)
- [x] Favicon displays properly (`/icon.svg` & `/favicon.ico`)
- [x] Privacy Policy accessible at `/privacy`
- [x] Terms & Conditions accessible at `/terms`
- [x] Zero "Made with AI" badges present
