# GitHub Setup Guide for AI EXPENSE TRACKING

This guide provides safe, standard instructions for hosting your **AI EXPENSE TRACKING** repository on your personal GitHub account.

---

## ⚠️ Important Safety Guidelines

- **Never Force-Push (`--force`):** Do not run `git push --force`. Force pushing can overwrite branches, wipe out remote history, and cause irreversible data loss.
- **Never Commit Secrets:** Your Google Gemini API key belongs strictly in your local `.env` file. Ensure `.env` is listed in `.gitignore` (already configured) and never commit or push it.
- **Set Your Own Remote:** Ensure the Git remote origin points to your own newly created repository, not an upstream reference or template repository.

---

## 🚀 Setting Up Your GitHub Repository

### Step 1: Create a New Repository on GitHub

1. Log in to [GitHub](https://github.com/).
2. Click **New Repository** (or visit [github.com/new](https://github.com/new)).
3. Enter your repository details:
   - **Repository name:** `ai-expense-tracking` (or your preferred name)
   - **Description:** Personal expense tracker with Google Gemini AI and gamified budgeting
   - **Visibility:** Public or Private
   - **Initialize with README / .gitignore / license:** Leave **UNCHECKED** (your project already has these configured locally).
4. Click **Create repository**.

---

### Step 2: Configure Your Remote URL

In your terminal at `C:\soapro`:

1. Check your existing remote:
   ```bash
   git remote -v
   ```

2. Point origin to your new repository:
   ```bash
   git remote set-url origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME.git
   ```
   *(Replace `YOUR_GITHUB_USERNAME` and `YOUR_REPOSITORY_NAME` with your actual GitHub username and repository name).*

---

### Step 3: Push Your Code Safely

1. Verify status and branch:
   ```bash
   git status
   git branch -M main
   ```

2. Push cleanly without force flags:
   ```bash
   git push -u origin main
   ```

---

## 🔐 Authentication Notes

When prompted for GitHub credentials:
- **Username:** Your GitHub username
- **Password:** A GitHub **Personal Access Token (Classic or Fine-Grained)** with `repo` permissions. GitHub does not accept account passwords for command-line Git authentication.
- Or use the official GitHub CLI:
  ```bash
  gh auth login
  ```
