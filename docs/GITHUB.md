# GitHub Setup

SkidHub lives in a single GitHub repository. Netlify watches the `main` branch
and deploys automatically on every push.

## 1. Create the repository

1. Go to <https://github.com/new>.
2. Name it (e.g. `skidhub`), choose visibility, and create it **without** a README (this project already has one).

## 2. Push the project

```bash
git init                       # if not already a repo
git add .
git commit -m "Initial SkidHub commit"
git branch -M main
git remote add origin https://github.com/<you>/skidhub.git
git push -u origin main
```

## 3. Protect your secrets

- The [`.gitignore`](../.gitignore) already excludes `.env` / `.env.local`.
- **Never commit real secrets.** Only [`.env.example`](../.env.example) (placeholders) is tracked.
- If you ever leak a secret, rotate it immediately (Discord: regenerate client secret; Supabase: rotate service-role key).

## 4. Connect to Netlify

Once pushed, follow the [Netlify deployment guide](./NETLIFY.md) to link the repo
and enable continuous deployment. From then on:

```
git push origin main   ->   Netlify builds and deploys automatically
```

## Branching (optional)

For safe iteration, work on feature branches and open pull requests into `main`.
Netlify creates **Deploy Previews** for pull requests so you can review changes
on a live URL before merging.
