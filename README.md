# waterpedia UM

A prototype for looking at water quality at Tasik Varsiti and the UM Green Belt wetland, Universiti Malaya. The map, stations, samples, and reports use sample data from September 2025 through November 2026. Nothing you click is saved to a server. If you close the browser, those on-screen changes are not stored online.

This guide is for opening the project and working in it even if you have never programmed before.

## 1. Install two programs

Do this once on the computer.

1. **Git**, so you can download the project and save your work on a branch. Download it from [https://git-scm.com/download/win](https://git-scm.com/download/win). In the installer you can leave every option as it is and click Next until the end.
2. **Node.js**, the program that turns the page on your computer. Go to [https://nodejs.org](https://nodejs.org) and download the button that says **LTS** (the recommended version). Install it with the options that are already checked.

When both installers finish, close any terminal or Cursor window that was already open, then open them again. If you skip this, the computer sometimes still cannot see the new programs.

### Check that they installed

1. Press the Windows key, type `PowerShell`, and open it.
2. Type this and press Enter:

```powershell
git --version
```

3. Then type this and press Enter:

```powershell
node --version
```

Each one should print a version number, for example `git version 2.45.0` or `v22.14.0`. If PowerShell says it does not recognize `git` or `node`, close that window, open it again, and repeat both commands. If it still fails, run the installer again.

## 2. Download the project

In the same PowerShell window, go to the folder where you want to keep it. For example, the Desktop:

```powershell
cd $env:USERPROFILE\Desktop
```

`cd` means “go into this folder.” Then copy the project from GitHub:

```powershell
git clone https://github.com/a01752433/waterpediaUM.git
```

That creates a folder named `waterpediaUM`. Go into it:

```powershell
cd waterpediaUM
```

Open it in Cursor: **File → Open Folder**, and choose that `waterpediaUM` folder.

## 3. Turn the page on

Type these commands in Cursor’s terminal. Open it with **Terminal → New Terminal**. It should say you are inside `waterpediaUM`. If it does not, type `cd` and the path to the folder.

The first time, install what the project needs. This takes a little while. You only repeat it if someone adds a new tool:

```powershell
npm install
```

Then turn the page on:

```powershell
npm run dev
```

The terminal prints a line like this:

```text
Local:   http://localhost:5173/
```

Copy that address, paste it into Chrome or Edge, and press Enter. `localhost` means “this computer.” You do not need the internet to view the page after `npm install` has finished.

If it says port 5173 is already in use and prints another number, for example `http://localhost:5174/`, open that one. It is the same page.

To turn it off, click the terminal and press `Ctrl+C`. Press `Y` or Enter if it asks you to confirm. The page stops loading until you run `npm run dev` again.

Each time you want to work, open the folder in Cursor and only run `npm run dev`. You do not need to clone or install again.

## 4. What is on the page

| Where | What you see |
| --- | --- |
| `/` | The lake map, the stations, and the filters |
| Profile | Click the **Firdaus** chip at the top right. That page shows samples by month and the map for that month |
| `/upload` | Upload a field sheet and review the data. From the map, use the **Upload samples** button |
| `/compare` | Compare several stations |
| `/archive` | The history table, the citation, and an export example |

The full address is the local link plus the path. If your terminal says `http://localhost:5173/`, the archive is at `http://localhost:5173/archive`.

## 5. How branches work

Think of the project as a shared document.

- **`main`** is the copy everyone shares. Do not do the day’s edits there.
- A **branch** is your own copy. You can try changes without overwriting what is already on `main`, and without overwriting what someone else is doing.

A good branch name says who you are and what you are changing, in lowercase, with hyphens. Example: `ana/adjust-map`.

### Get the latest copy before you start

```powershell
git checkout main
git pull
```

`checkout main` puts you on the shared copy. `pull` downloads the latest changes that have already been merged on GitHub.

### Create your branch

```powershell
git checkout -b ana/adjust-map
```

Replace `ana/adjust-map` with your name and the change. From here, what you edit stays on that branch, not on `main`.

To see which branch you are on:

```powershell
git status
```

The first line says `On branch` and the name.

### Save the change and upload it

When the page looks the way you want:

```powershell
git status
git add .
git commit -m "Adjust the lake map"
git push -u origin ana/adjust-map
```

What each command does:

- `git status` lists the files you changed. Read it before you continue.
- `git add .` stages those files. The dot means “this folder.”
- `git commit -m "..."` saves a snapshot on your computer. The text in quotes is the title of the change. Keep it to one short sentence.
- `git push -u origin ana/adjust-map` uploads that branch to GitHub. You only need `-u` the first time on that branch. After that, `git push` is enough.

In `push`, the name after `origin` has to be the same name you used in `git checkout -b`.

### Ask for it to be merged into `main`

When `push` finishes, GitHub sometimes prints a link to open a **pull request**. Open it. If no link appears, go to the repository in the browser: [https://github.com/a01752433/waterpediaUM](https://github.com/a01752433/waterpediaUM). A banner at the top offers to compare your branch. Create the pull request into `main`, and write a few lines about what you changed and how you tried it (for example: “I opened the map and the profile”).

Someone else reviews that request and merges it into `main`. Do not merge your own branch if the team agreed that another person reviews it first.

### Switch branches

To go back to yours, or to look at someone else’s:

```powershell
git checkout ana/adjust-map
```

If that branch exists on GitHub but not on your computer yet:

```powershell
git fetch
git checkout ana/adjust-map
```

`fetch` looks up which branches are on GitHub without changing your files.

### Bring new `main` work into your branch

If `main` moved forward while you were still on your branch:

```powershell
git checkout main
git pull
git checkout ana/adjust-map
git merge main
```

That copies the accepted `main` work into your branch. If Git talks about a **conflict**, do not delete files at random. Show the message to the person helping you.

## 6. Three things not to do

- Do not make the day’s changes directly on `main`. Create a branch.
- Do not upload passwords or files named `.env`. This prototype does not need them.
- Do not use `git push --force`. It can erase someone else’s work on GitHub.
