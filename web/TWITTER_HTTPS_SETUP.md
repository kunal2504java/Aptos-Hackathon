# Twitter Bot HTTPS Setup Guide

Since Twitter requires HTTPS URLs, here are the best solutions for development:

## 🚀 **Option 1: Use Cloudflare Tunnel (Recommended)**

### **Step 1: Install Cloudflare Tunnel**
```bash
npm install -g cloudflared
```

### **Step 2: Start Your Next.js App**
```bash
cd web
npm run dev
```

### **Step 3: Start Cloudflare Tunnel**
```bash
cloudflared tunnel --url http://localhost:3000
```

This will give you a URL like: `https://abc123.trycloudflare.com`

### **Step 4: Update Twitter Settings**
- **Website**: `https://abc123.trycloudflare.com`
- **Callback URL**: `https://abc123.trycloudflare.com`

## 🚀 **Option 2: Use Serveo (Simple)**

### **Step 1: Start Your Next.js App**
```bash
cd web
npm run dev
```

### **Step 2: Start Serveo**
```bash
ssh -R 80:localhost:3000 serveo.net
```

This will give you a URL like: `https://abc123.serveo.net`

## 🚀 **Option 3: Use a Free Hosting Service**

### **Deploy to Vercel (Easiest)**
1. Go to [vercel.com](https://vercel.com)
2. Connect your GitHub repository
3. Deploy your app
4. Use the Vercel URL for Twitter settings

### **Deploy to Netlify**
1. Go to [netlify.com](https://netlify.com)
2. Connect your repository
3. Deploy your app
4. Use the Netlify URL for Twitter settings

## 🚀 **Option 4: Use a Development Domain**

### **Use a subdomain service**
1. Go to [freenom.com](https://freenom.com) (free domains)
2. Register a free domain like `yourname.tk`
3. Set up DNS to point to your local IP
4. Use `https://yourname.tk` for Twitter settings

## 📝 **Environment Variables**

Once you have a working HTTPS URL, update your `.env.local`:

```env
# Twitter API Configuration
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_SECRET=your_access_secret_here
TWITTER_BEARER_TOKEN=your_bearer_token_here

# Web App URL - Use your HTTPS URL
WEBAPP_URL=https://your-https-url.com
```

## 🎯 **Recommended Approach**

For development, I recommend:

1. **Use Cloudflare Tunnel** (most reliable)
2. **Deploy to Vercel** (easiest for production)
3. **Use Serveo** (simple but less reliable)

## ⚠️ **Important Notes**

- **Keep both services running**: Next.js app + tunnel service
- **URLs may change**: Update Twitter settings when URLs change
- **HTTPS is required**: Twitter won't accept HTTP URLs
- **Test the URL**: Make sure it works in your browser

## 🚀 **Quick Start with Cloudflare**

```bash
# Terminal 1: Start Next.js app
cd web
npm run dev

# Terminal 2: Start Cloudflare tunnel
cloudflared tunnel --url http://localhost:3000
```

Copy the HTTPS URL and use it in Twitter settings!
