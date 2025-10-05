# 🛠️ Creator Intelligence Platform - Setup Guide

This guide will walk you through setting up all the required API keys and authentication for the Creator Intelligence Platform.

---

## 📋 Prerequisites

- Google account with access to Google Cloud Console
- Active YouTube channel for testing
- Node.js 18+ installed on your system

---

## 🔐 Environment Variables Setup

Create a `.env.local` file in your project root with the following variables:

```env
# Google OAuth & YouTube
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
YOUTUBE_API_KEY=your_youtube_api_key

# AI Services
GROQ_API_KEY=your_groq_api_key
MISTRAL_API_KEY=your_mistral_api_key

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

---

## 🤖 AI Service API Keys

### 1. Groq API Key
**Purpose**: Powers our Llama models for sentiment analysis

1. Visit [Groq Console](https://console.groq.com/keys)
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Click **Create API Key**
5. Copy the generated key and add it to your `.env.local` as `GROQ_API_KEY`

### 2. Mistral AI API Key
**Purpose**: Handles intelligent reply generation

1. Go to [Mistral AI Console](https://admin.mistral.ai/organization/api-keys)
2. Create an account or sign in
3. Navigate to **API Keys** in your organization settings
4. Click **Create new key**
5. Copy the key and add it to your `.env.local` as `MISTRAL_API_KEY`

---

## 🔧 Google Cloud Platform Setup

### Step 1: Create OAuth 2.0 Client

1. Visit [Google Cloud Console - Credentials](https://console.cloud.google.com/auth/clients)
2. Select your project or create a new one
3. Click **Create Credentials** → **OAuth client ID**
4. Choose **Web application** as the application type
5. Configure the OAuth client:

   **Application Name**: `Creator Intelligence Platform`

   **Authorized JavaScript Origins**:
   ```
   http://localhost:3000
   ```

   **Authorized Redirect URIs**:
   ```
   http://localhost:3000/api/auth/callback/google
   ```

6. Click **Create**
7. Copy the **Client ID** and **Client Secret**
8. Add them to your `.env.local`:
   ```env
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```

### Step 2: Configure Test Audience

1. Navigate to [Google Cloud Console - OAuth Audience](https://console.cloud.google.com/auth/audience)
2. Click **Add Test Users**
3. Add the Gmail address you'll use for testing
4. Save the configuration

### Step 3: Create YouTube Data API Key

1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **Create Credentials** → **API Key**
3. Copy the generated API key
4. Add the key to your `.env.local`:
   ```env
   YOUTUBE_API_KEY=your_youtube_api_key_here
   ```

### Step 4: Enable Required APIs

Ensure these APIs are enabled in your Google Cloud project:

1. **YouTube Data API v3**
   - [Enable YouTube Data API v3](https://console.cloud.google.com/apis/library/youtube.googleapis.com)

2. **YouTube Analytics API**
   - [Enable YouTube Analytics API](https://console.cloud.google.com/apis/library/youtubeanalytics.googleapis.com)

---

## 🔒 Authentication Secret

Generate a secure secret for NextAuth:

```bash
# Option 1: Use OpenSSL (if available)
openssl rand -base64 32

# Option 2: Use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Use an online generator
# Visit: https://generate-secret.vercel.app/32
```

Add the generated secret to your `.env.local`:
```env
NEXTAUTH_SECRET=your_generated_secret_here
```

---

## ✅ Verification Checklist

Before running the application, verify:

- [ ] All API keys are correctly added to `.env.local`
- [ ] Google OAuth client is configured with correct redirect URLs
- [ ] Test user email is added to OAuth audience
- [ ] YouTube Data API v3 is enabled
- [ ] YouTube Analytics API is enabled
- [ ] NextAuth secret is generated and added

---

## 🚀 Testing Your Setup

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open the application**:
   ```
   http://localhost:3000
   ```

3. **Test authentication**:
   - Click "Sign in with Google"
   - Authorize the application
   - Verify you can access the dashboard

---

## 🔧 Troubleshooting

### Common Issues

**"Access blocked" error during Google Sign-in**
- Ensure your email is added to the test audience
- Verify the redirect URI exactly matches the configuration

**"API key not valid" errors**
- Check that the YouTube Data API v3 is enabled
- Verify the API key is correctly copied without extra spaces

**"Authentication failed" errors**
- Regenerate the NextAuth secret
- Clear browser cookies and try again

**No analytics data showing**
- Ensure you're testing with a YouTube channel you own
- Try with a different video that has recent activity

### Need Help?

If you encounter issues not covered here:

1. Check the browser console for detailed error messages
2. Verify all environment variables are correctly set
3. Ensure your Google Cloud project has the required APIs enabled
4. Try testing with a different YouTube video/channel

---

## 🎯 Next Steps

Once setup is complete:

1. **[Return to Main README](./README.md)** for usage instructions
2. **Explore the dashboard** with your own YouTube content
3. **Test AI features** with real comment data
4. **Analyze performance insights** for your videos

---

<div align="center">
<sub>Setup complete? Ready to unlock the power of AI-driven creator intelligence! 🚀</sub>
</div>