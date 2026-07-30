---
name: releasing-a-version
description: Walks through cutting a new version of the Marola Beat bot -- bumping package.json, updating CHANGELOG.md, tagging, and publishing a GitHub Release. Use when the user asks to release, tag, or cut a new version of this project.
---

# Releasing a version

Follow [Semantic Versioning](https://semver.org/): MAJOR for breaking changes (command removed/
renamed, env var renamed), MINOR for new commands/features, PATCH for fixes only.

## Checklist

Copy this into your response and check items off as you go:

```
- [ ] main is green (CI passing) and up to date locally
- [ ] package.json version bumped
- [ ] CHANGELOG.md has a new dated section for the version, following Keep a Changelog format
- [ ] npm run typecheck / lint / build all pass
- [ ] git tag created and pushed
- [ ] GitHub Release published from the tag, body copied from the CHANGELOG entry
```

## Steps

1. Confirm the target branch is `main`, clean, and CI is green (`gh run list --branch main --limit
1`).
2. Bump `"version"` in `package.json` (no separate lockfile version bump needed).
3. Add a new `## [x.y.z] - YYYY-MM-DD` section at the top of `CHANGELOG.md`, under `Added`/
   `Changed`/`Fixed` as appropriate — see existing entries for the format.
4. Run the full verification suite:
   ```bash
   npm run typecheck && npm run lint && npm run build
   ```
5. Commit as `chore(release): vX.Y.Z`, push, then tag and push the tag:
   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```
6. Create the GitHub Release from the tag with the CHANGELOG section as the body:
   ```bash
   gh release create vX.Y.Z --title vX.Y.Z --notes-file <(sed -n '/## \[X.Y.Z\]/,/## \[/p' CHANGELOG.md | sed '$d')
   ```
   (or simpler: `gh release create vX.Y.Z --title vX.Y.Z --generate-notes` and paste the CHANGELOG
   section manually if the sed one-liner is fiddly.)
7. If Coolify's Auto Deploy is scoped to `main`, the release is live once the push in step 5 built;
   otherwise trigger a redeploy per
   [deploying-to-coolify](../deploying-to-coolify/SKILL.md).

Ask the user for confirmation before pushing tags or creating the GitHub Release — these are
visible, hard-to-fully-undo actions.
