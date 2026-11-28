# AI grader setup (DeepSeek + Cloudflare Worker)

The game is plain files on GitHub Pages, so an API key put in the game's code
would be visible to everyone. Instead, a tiny free **Cloudflare Worker** holds
your DeepSeek key: the game sends it the answer, the Worker asks DeepSeek and
sends back the score. Takes about 10 minutes, no installing anything.

## 1. Get your DeepSeek key
platform.deepseek.com -> API keys -> create one. Copy it (starts with `sk-`).

## 2. Make the Worker
1. Sign up / log in at **dash.cloudflare.com** (free plan is fine).
2. Left menu: **Compute (Workers)** -> **Workers & Pages** -> **Create** -> **Create Worker**
   (pick "Hello World"), name it e.g. `hotel-grader`, then **Deploy**.
3. Click **Edit code**, delete everything, paste the whole of `worker/grader-worker.js`,
   then **Deploy**.

## 3. Add your key (as a secret)
In the Worker: **Settings -> Variables and Secrets -> Add**
- Type **Secret**, name `DEEPSEEK_API_KEY`, value = your `sk-...` key. Save / Deploy.

Optional (type **Text**):
- `ALLOWED_ORIGINS` – only needed if the game isn't at `https://potatoaimdotexe.github.io`
  (comma-separated list of site addresses, no trailing slash).
- `MODEL` – defaults to `deepseek-flash` (the cheap fast model).

## 4. Point the game at it
Copy the Worker's address (e.g. `https://hotel-grader.yourname.workers.dev`) and paste it
into `js/main.js`:

```js
const AI_GRADER_URL = "https://hotel-grader.yourname.workers.dev";
```

Commit + push. Done. Leave it `""` to go back to the placeholder graders.

## What's protected
- The key never leaves Cloudflare.
- Only your site's address (and localhost, for testing) can use the Worker.
- Each request and reply is size-capped, and each visitor gets at most 50 gradings
  per 10 minutes (rough limit), so nobody can drain your tokens by spamming it.
- If the Worker or DeepSeek is down, the games still work: Detective shows the
  reasoning as unscored, Paralegal falls back to the keyword check.

## Cost
One grading sends the case + answer (roughly 1,500-3,000 tokens in, under 800 out).
With `deepseek-flash` that's a tiny fraction of a cent per grading; check current
prices on DeepSeek's pricing page.
