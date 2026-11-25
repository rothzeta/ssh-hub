# SSH Hub

SSH Hub is a single page that opens your existing browser terminals in new tabs. The terminal hosts handle their own sign-in. SSH Hub provides no terminal emulator, SSH connection, or authentication. Put it behind an authentication gateway if the directory itself needs access control.

Use `/` to focus the filter, `Esc` to clear it, and `?` or **Keyboard help** to open the shortcut guide. The character shortcuts apply outside editable fields. **System** follows the device’s color scheme. The browser remembers a manual choice on the same origin.

## Configuration

The browser loads `config.json` beside `index.html` on each page load. Runtime environment variables take precedence over that file. The bundled defaults supply omitted display fields and cover a missing or invalid file. An invalid file shows a dismissible warning naming the first failing field. Replace the reserved example hostname with the address of an existing terminal.

```json
{
  "title": "SSH",
  "subtitle": "Browser terminals",
  "theme": {
    "name": "ssh-hub",
    "colors": {
      "accent": "oklch(72% 0.14 190)",
      "base-100": "oklch(21% 0.02 260)"
    }
  },
  "links": [
    {
      "id": "example-terminal",
      "label": "Example terminal",
      "url": "https://terminal.example.com",
      "description": "Example browser terminal",
      "tags": ["example"],
      "accent": "oklch(72% 0.14 190)"
    }
  ]
}
```

| Field | Type and behavior |
| --- | --- |
| `title`, `subtitle` | Optional strings. The title must be non-empty. An empty subtitle hides it. |
| `theme.name` | Optional non-empty string exposed as `data-theme-name` on the root element. The appearance control selects the stylesheet’s light or dark palette. |
| `theme.colors` | Optional object of literal CSS colors such as OKLCH, hex, RGB, or named colors. Each recognized key overrides its daisyUI variable on the root element in both modes. |
| `links` | Required array in display order. An empty array is valid. |
| `links[].id`, `links[].label` | Required non-empty strings. Each ID must be unique. |
| `links[].url` | Required absolute HTTP(S) URL without embedded credentials. |
| `links[].description` | Optional string. The URL hostname appears when the description is omitted or blank. |
| `links[].tags` | Optional array of non-empty strings. |
| `links[].accent` | Optional literal CSS color. Defaults to the active palette’s accent. |

The recognized daisyUI color keys are `base-100`, `base-200`, `base-300`, `base-content`, `primary`, `secondary`, `accent`, `neutral`, `info`, `success`, `warning`, and `error`, plus the `-content` counterpart of each key from `primary` onward. Other color keys are ignored. Choose overrides with readable contrast in both modes.

### Environment variables

`SSHHUB_CONFIG` accepts a complete JSON document and wins over all other configuration sources. Alternatively set `SSHHUB_TITLE`, `SSHHUB_SUBTITLE`, `SSHHUB_LINKS` (JSON array), or `SSHHUB_THEME_COLORS` (JSON object). Each supplied variable replaces that field in the mounted or baked config, or in the bundled defaults if no file exists. `SSHHUB_THEME_COLORS` replaces the entire color map.

```sh
docker run --rm -p 8080:8080 --read-only --tmpfs /tmp \
  -e SSHHUB_TITLE='Probe' ssh-hub:dev
```

Set the example values in `docker-compose.yaml` and run `docker compose up --build` to use the environment-based setup with a health check.

### Mounted or baked file

Save the above JSON as `config.json`. Mount it read-only beside the page, or copy it to the same path in a derived image.

```sh
docker run --rm -p 8080:8080 --read-only --tmpfs /tmp \
  --mount "type=bind,source=$PWD/config.json,target=/usr/share/nginx/html/config.json,readonly" \
  ssh-hub:dev
```

When serving the build directly from another static server, place the file beside `dist/index.html`. For a proxy prefix such as `/terminals/`, redirect the slashless URL to the directory URL and strip the prefix when forwarding requests. Asset and config URLs are relative to that directory.

## Build and check

Use an up-to-date Node 22 or later and npm.

```sh
npm ci
npm run dev
npm run build
npm run lint
npm run check:config
docker build -t ssh-hub:dev .
```

`npm run dev` serves a local `config.json` from the repository root if present. `npm run build` type-checks the Vue code and writes the static site to `dist/`. The image serves it on port 8080 as UID 101. `GET /healthz` returns `ok`.

One static bundle keeps the build independent of deployment configuration. Native links handle keyboard activation and new tabs, and Reka UI handles focus and navigation for the dialog and appearance controls. System fonts and CSS decoration keep initial layout stable and avoid external assets. Nginx serves optional environment output from `/tmp` so the document root can stay read-only.

## Container releases

To cut a release, push an annotated `vX.Y.Z` tag on the release commit from `main`. For example, with the `1.0.0` release commit checked out:

```sh
git tag -a v1.0.0 -m 'Release 1.0.0'
git push origin v1.0.0
```

GitHub Actions builds and pushes `ghcr.io/rothzeta/ssh-hub` with these tags.

| Push | Image tags |
| --- | --- |
| `main` | `sha-<first 7 characters of the commit SHA>`, `edge` |
| `vX.Y.Z` | `sha-<first 7 characters of the commit SHA>`, `X.Y.Z`, `X.Y` |

For deployments, pin the image by the digest printed in the workflow log, using `ghcr.io/rothzeta/ssh-hub@sha256:<digest>`. Tags can move to a different digest.
