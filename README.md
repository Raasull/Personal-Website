# Rasul Guliyev — Personal Portfolio

A minimalist, dark-themed portfolio for sharing my background and selected SITE 1101 work. The site is built with semantic HTML, CSS, and vanilla JavaScript, with no build step or runtime dependencies.

## Live site

[https://raasull.github.io/Personal-Website/](https://raasull.github.io/Personal-Website/)

## Pages

- `index.html` — introduction and featured projects
- `about.html` — background and an interactive signal-frequency tuner
- `projects.html` — overview of the three selected projects
- `project-1.html`, `project-2.html`, `project-3.html` — individual project details

## Project structure

```text
.
├── index.html
├── about.html
├── projects.html
├── project-1.html
├── project-2.html
├── project-3.html
├── css/
│   └── style.css
├── js/
│   └── script.js
└── assets/
    └── images/
        ├── github.svg
        └── profile.jpg
```

`profile.jpg` is a clearly marked abstract placeholder because no portrait was provided. Replace it with a personal photo while keeping the same filename, or update the image path in `index.html`.

## Run locally

From the repository root, start a local server:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Interactions

- The sticky navigation pill aligns to the current page before it becomes visible, then follows hover and keyboard focus.
- Project cards link directly to their detail pages.
- The About page's frequency tuner reveals profile details as you lock onto signals.
- Scroll reveals and transitions respect reduced-motion preferences.
- Shared page styling and interactions live in `css/style.css` and `js/script.js`.
