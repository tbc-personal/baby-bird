# Running Nestling on your own machine

Written for someone who has never run a web app locally. If you already have Node and a
terminal, the short version is: `npm install`, then `npm run dev`, then open
<http://localhost:5173>.

## 1. Install Node.js — once, ever

Download the version marked **LTS** from <https://nodejs.org> and run the installer with the
default options.

To check it worked, open a terminal — on a Mac press <kbd>⌘</kbd>+<kbd>Space</kbd>, type
`Terminal`, press Enter; on Windows press <kbd>Start</kbd>, type `PowerShell`, press Enter —
and run:

```
node --version
```

You want something like `v22.20.0`. Anything `v20` or higher works. If you get "command not
found", close that terminal and open a new one: the installer only affects terminals opened
after it ran.

## 2. Get the code

You do not need git. On GitHub, open the branch you want, click the green **Code** button and
choose **Download ZIP**. Double-click the zip to unpack it, and move the resulting folder
somewhere you can find it — the Desktop is fine.

The direct link for a branch is:

```
https://github.com/tbc-personal/baby-bird/archive/refs/heads/<branch-name>.zip
```

## 3. Point the terminal at that folder

Type `cd` followed by a space, then **drag the unpacked folder onto the terminal window** —
that pastes its path. Press Enter.

```
cd ~/Desktop/baby-bird-main
```

Check you are in the right place with `ls` (Mac) or `dir` (Windows): you should see
`package.json`, `src` and `docs`.

## 4. Install the dependencies — once per download

```
npm install
```

A minute or two, and a lot of output. **A yellow warning about vulnerabilities is normal and
can be ignored** — it concerns build tooling, not the app. Only a red `ERR!` matters.

## 5. Run it

```
npm run dev
```

It prints:

```
  ➜  Local:   http://localhost:5173/
```

Open <http://localhost:5173>. Leave the terminal open; closing it stops the app. Edits to the
source reload in the browser straight away.

- **Stop it:** click the terminal and press <kbd>Ctrl</kbd>+<kbd>C</kbd> — Ctrl, not ⌘, even
  on a Mac.
- **Run it again later:** open a terminal, `cd` to the folder, `npm run dev`. Step 4 does not
  repeat.

## What you should see

- It opens on **Setup**, because no date is saved yet. Enter one and press **Show me my
  nestling**.
- **Every card shows a bird silhouette tagged "Photo coming."** That is expected, not a bug:
  no image has been curated yet. See `docs/CURATION.md`.
- Dark mode follows your operating system's setting, so flip your OS theme to check both.
- Your date lives in that browser only. Clearing site data resets the app to Setup.

## The other commands

Only `npm run dev` is needed to look at the app. The rest are what CI runs:

| Command | What it does |
|---|---|
| `npm run test` | Unit tests. Fast. |
| `npm run lint` | ESLint, plus the ADR-007 rule banning literal colors |
| `npm run typecheck` | TypeScript, no output produced |
| `npm run build` | The production build, into `dist/` |
| `npm run preview` | Serves the production build, to check it as shipped |
| `npm run test:e2e:smoke` | Playwright browser tests. Needs `npx playwright install chromium` first. |

Do **not** run `npm run test:e2e:update` to fix failing screenshot tests. Those baselines are
pixel comparisons of text, which rasterizes differently on different machines, so they have to
be generated on the GitHub runner that checks them. See the README.

## If something goes wrong

| What you see | What it means |
|---|---|
| `npm: command not found` | Node did not install, or you need a freshly opened terminal |
| `ENOENT: no such file or directory, open 'package.json'` | Wrong folder. Redo step 3, and make sure you dragged the unpacked folder rather than the zip |
| `Port 5173 is in use` | It is already running in another terminal. Vite picks 5174 and says so |
| A blank white page | Check the terminal for a red error; it usually names the file |
