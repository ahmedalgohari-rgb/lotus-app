# GitHub Pages Deployment Instructions

This guide explains how to deploy the Lotus Plant Care legal documents to GitHub Pages, making them publicly accessible for Facebook OAuth approval and user reference.

---

## 📁 Files Overview

All legal documents are located in the `docs/` folder:

```
docs/
├── index.html                  # Homepage with links to all legal documents
├── privacy-policy.html         # Privacy Policy (HTML)
├── privacy-policy.md          # Privacy Policy (Markdown source)
├── terms-of-service.html      # Terms of Service (HTML)
├── terms-of-service.md        # Terms of Service (Markdown source)
├── data-deletion.html         # Data Deletion Instructions (HTML)
├── data-deletion.md           # Data Deletion Instructions (Markdown source)
└── styles.css                 # Shared stylesheet for all pages
```

---

## 🚀 Deployment Steps

### Step 1: Commit the Legal Documents

First, commit all the legal documents to your repository:

```bash
# Navigate to your project directory
cd /Users/ahmedalgohari/Lotus

# Check current status
git status

# Add all docs files
git add docs/

# Create a commit
git commit -m "$(cat <<'EOF'
feat: Add legal documents for Facebook OAuth compliance

- Privacy Policy (HTML + Markdown)
- Terms of Service (HTML + Markdown)
- Data Deletion Instructions (HTML + Markdown)
- Professional homepage with navigation
- Responsive CSS styling
- GDPR compliant documentation

Required for Facebook OAuth approval.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# Push to your branch
git push origin alaa-alo2a
```

### Step 2: Merge to Main Branch

GitHub Pages typically deploys from the `main` or `master` branch:

```bash
# Switch to main branch (create if doesn't exist)
git checkout main || git checkout -b main

# Merge your branch
git merge alaa-alo2a

# Push to main
git push origin main
```

**Alternative:** If you want to keep your current branch structure, you can configure GitHub Pages to deploy from your `alaa-alo2a` branch (see Step 3 below).

### Step 3: Enable GitHub Pages

1. Go to your GitHub repository: [https://github.com/ahmedalgohari-rgb/lotus-app](https://github.com/ahmedalgohari-rgb/lotus-app)

2. Click **Settings** (top right)

3. Scroll down to **Pages** section (left sidebar under "Code and automation")

4. Under **"Build and deployment"**:
   - **Source:** Select "Deploy from a branch"
   - **Branch:** Select `main` (or `alaa-alo2a` if you didn't merge)
   - **Folder:** Select `/docs`
   - Click **Save**

5. GitHub will automatically build and deploy your site

6. Wait 1-2 minutes for deployment

7. Your site will be available at:
   ```
   https://ahmedalgohari-rgb.github.io/lotus-app/
   ```

### Step 4: Verify Deployment

Once deployed, verify all pages are accessible:

- **Homepage:** https://ahmedalgohari-rgb.github.io/lotus-app/
- **Privacy Policy:** https://ahmedalgohari-rgb.github.io/lotus-app/privacy-policy.html
- **Terms of Service:** https://ahmedalgohari-rgb.github.io/lotus-app/terms-of-service.html
- **Data Deletion:** https://ahmedalgohari-rgb.github.io/lotus-app/data-deletion.html

Click through all links to ensure navigation works correctly.

---

## 📝 Use These URLs for Facebook OAuth

Once deployed, add these URLs to your Facebook App settings:

### Facebook Developer Console → Settings → Basic

1. **Privacy Policy URL:**
   ```
   https://ahmedalgohari-rgb.github.io/lotus-app/privacy-policy.html
   ```

2. **Terms of Service URL:**
   ```
   https://ahmedalgohari-rgb.github.io/lotus-app/terms-of-service.html
   ```

3. **User Data Deletion URL:**
   ```
   https://ahmedalgohari-rgb.github.io/lotus-app/data-deletion.html
   ```

**✅ Important:** Facebook requires HTTPS URLs, which GitHub Pages provides automatically!

---

## 🔄 Updating Legal Documents

When you need to update the legal documents:

### Option 1: Update HTML Directly

1. Edit the HTML file (e.g., `docs/privacy-policy.html`)
2. Update the "Last Updated" date
3. Commit and push:
   ```bash
   git add docs/privacy-policy.html
   git commit -m "docs: Update Privacy Policy - [describe changes]"
   git push origin main
   ```
4. GitHub Pages auto-deploys within 1-2 minutes

### Option 2: Update Markdown, Then Regenerate HTML

1. Edit the Markdown file (e.g., `docs/privacy-policy.md`)
2. Regenerate the HTML version (manually or with a tool)
3. Update the "Last Updated" date in both files
4. Commit and push both files
5. GitHub Pages auto-deploys

---

## 🛠️ Troubleshooting

### Issue: Pages Not Loading

**Problem:** 404 errors or blank pages

**Solutions:**
1. Verify the `/docs` folder is selected in GitHub Pages settings
2. Check that `index.html` exists in `/docs` (not project root)
3. Ensure file names match exactly (case-sensitive!)
4. Clear browser cache and try again

### Issue: CSS Not Loading

**Problem:** Pages load but have no styling

**Solutions:**
1. Check that `styles.css` is in the same folder as HTML files (`/docs`)
2. Verify the `<link>` tag in HTML: `<link rel="stylesheet" href="styles.css">`
3. Open browser DevTools → Network tab to see if CSS loads
4. Try hard refresh: `Cmd + Shift + R` (Mac) or `Ctrl + F5` (Windows)

### Issue: GitHub Pages Not Building

**Problem:** Changes pushed but site not updating

**Solutions:**
1. Check **Actions** tab in GitHub for build errors
2. Ensure branch is set correctly in Pages settings
3. Try pushing a small change to trigger rebuild
4. Wait up to 10 minutes (sometimes deployment is slow)

### Issue: Links Between Pages Not Working

**Problem:** Clicking links leads to 404

**Solutions:**
1. Verify all HTML files are in `/docs` folder
2. Check that links are relative (e.g., `privacy-policy.html`, not `/privacy-policy.html`)
3. Ensure file names match exactly (case-sensitive)

---

## 📊 Analytics & Monitoring (Optional)

If you want to track page views:

1. **GitHub Insights:** Go to repository → Insights → Traffic
   - Shows page views and unique visitors (only for repo owners)

2. **Google Analytics:** Add tracking code to each HTML page
   - Free, detailed analytics
   - Insert before `</head>` tag

3. **Cloudflare Analytics:** Use Cloudflare as a proxy
   - Free tier available
   - Privacy-friendly analytics

**Note:** For privacy-focused legal pages, minimal analytics is recommended.

---

## 🔒 Security Best Practices

### HTTPS (Already Enabled)
✅ GitHub Pages automatically provides HTTPS for all pages

### Content Security Policy (Optional)
Add a `<meta>` tag to each HTML page to enhance security:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline';">
```

### Regular Updates
- Review and update legal documents annually
- Update "Last Updated" dates whenever changes are made
- Monitor for changes in privacy laws (GDPR, CCPA, etc.)

---

## 📋 Checklist: Before Going Live

Use this checklist before submitting your Facebook App for review:

- [ ] All legal documents committed and pushed to GitHub
- [ ] GitHub Pages enabled and deployed successfully
- [ ] Homepage loads correctly with navigation
- [ ] Privacy Policy page loads and displays correctly
- [ ] Terms of Service page loads and displays correctly
- [ ] Data Deletion page loads and displays correctly
- [ ] All internal links work (click through navigation)
- [ ] CSS styling loads on all pages
- [ ] Pages are mobile-responsive (test on phone)
- [ ] All external links work (Supabase, PlantNet, GitHub)
- [ ] "Last Updated" dates are correct on all pages
- [ ] Contact email (ahmedalgohari.rgb@gmail.com) is correct
- [ ] GitHub repository URL is correct
- [ ] HTTPS is enabled (check browser address bar for 🔒)
- [ ] URLs added to Facebook App settings
- [ ] Test accessing pages in incognito/private browsing mode

---

## 📞 Need Help?

If you run into issues deploying to GitHub Pages:

1. **GitHub Pages Documentation:** https://docs.github.com/en/pages
2. **GitHub Community Forum:** https://github.community/
3. **Contact GitHub Support:** https://support.github.com/

---

## 🎯 Next Steps After Deployment

Once your legal documents are live:

1. **Add URLs to Facebook App:**
   - Go to Facebook Developer Console
   - Navigate to Settings → Basic
   - Add the three URLs (Privacy, Terms, Data Deletion)
   - Click "Save Changes"

2. **Add URLs to Your App:**
   - Update `SettingsScreen.tsx` with links to legal documents
   - Add links to `AuthScreen.tsx` (below sign-in buttons)
   - Example:
     ```typescript
     <Text>
       By signing up, you agree to our{' '}
       <Text
         onPress={() => Linking.openURL('https://ahmedalgohari-rgb.github.io/lotus-app/terms-of-service.html')}
         style={{ color: '#4CAF50', textDecorationLine: 'underline' }}
       >
         Terms of Service
       </Text>
       {' '}and{' '}
       <Text
         onPress={() => Linking.openURL('https://ahmedalgohari-rgb.github.io/lotus-app/privacy-policy.html')}
         style={{ color: '#4CAF50', textDecorationLine: 'underline' }}
       >
         Privacy Policy
       </Text>
     </Text>
     ```

3. **Submit Facebook App for Review:**
   - Once URLs are added, submit app for review
   - Facebook typically reviews within 1-3 business days
   - Monitor email for review updates

4. **Test OAuth After Approval:**
   - Test Google OAuth (already working)
   - Test Facebook OAuth (will work after approval)
   - Test on both iOS and Android if applicable

---

## 📝 Summary

**Quick Commands:**

```bash
# 1. Commit legal documents
git add docs/
git commit -m "feat: Add legal documents for Facebook OAuth"
git push origin alaa-alo2a

# 2. Merge to main (if needed)
git checkout main
git merge alaa-alo2a
git push origin main
```

**GitHub Pages Settings:**
- Source: Deploy from a branch
- Branch: `main`
- Folder: `/docs`

**Your Live URLs:**
- Homepage: https://ahmedalgohari-rgb.github.io/lotus-app/
- Privacy: https://ahmedalgohari-rgb.github.io/lotus-app/privacy-policy.html
- Terms: https://ahmedalgohari-rgb.github.io/lotus-app/terms-of-service.html
- Deletion: https://ahmedalgohari-rgb.github.io/lotus-app/data-deletion.html

---

**Last Updated:** 2025-11-09
**Status:** Ready for Deployment
**Estimated Time:** 5-10 minutes

Good luck with your deployment! 🌿✨
