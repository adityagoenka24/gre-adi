# S.D. Emergency Vault Viewer - Public Page Package

This folder is safe to publish as a static website because it contains only the read-only decrypt viewer.

Do not upload any `.sdvault` file, real credential file, backup, screenshot, password note, or test vault containing meaningful data.

## Files

- `index.html` - the public emergency viewer page.

## Recommended Publishing Options

### GitHub Pages

1. Create a new public GitHub repository, for example `sd-vault-viewer`.
2. Upload only `index.html` from this folder.
3. In the repository settings, enable Pages from the default branch.
4. Open the GitHub Pages HTTPS URL on iPhone Safari.
5. Add it to the iPhone Home Screen if desired.

### Netlify / Cloudflare Pages

Upload this folder as a static site. The site root should serve `index.html`.

## iPhone Use

1. Open the public HTTPS viewer page in Safari.
2. Tap **Choose File**.
3. Select your encrypted `.sdvault` file from Files/iCloud Drive/On My iPhone. The picker intentionally allows any file because iOS may grey out unknown `.sdvault` extensions when a file-type filter is used.
4. Enter the master password.
5. Tap **Unlock**.
6. Tap **Lock / Clear** when finished.

## Security Rule

The public viewer page is just code. The vault file stays private and is selected manually on the phone. If a hosting setup asks you to upload the `.sdvault` file, stop.
