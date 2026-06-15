# Play Store Readiness

Last checked: June 15, 2026

## Build artifact

- Upload an Android App Bundle, not an APK.
- This repo uses `apps/mobile/eas.json` production builds with `"buildType": "app-bundle"`.
- The Android package is `com.itwhispers.app`.
- The first upload should use version `1.0.0` and version code `1`; EAS remote versioning can auto-increment later.

## Policy posture for the first upload

- No accounts or login.
- No ads.
- No in-app purchases yet. Paid chapters/support remain visible only as "coming soon".
- No third-party analytics, crash reporting, or payment SDK is initialized in the first-upload build.
- No Android runtime permissions are requested by app config.
- The game loads over HTTPS and stores progress locally.

## Play Console declarations to prepare

- App category: Game.
- Target audience: teen-and-older/general audience. Do not target children under 13.
- Ads: No.
- App access: No restricted access, no login credentials required.
- Data safety: Complete the form. Use the hosted `/privacy` page as the privacy policy URL.
- Payments: No in-app products for this initial release. Add Google Play Billing before selling digital chapters or support inside the app.
- Content rating: complete the questionnaire honestly as horror/scary themes.

## Pre-submit checks

Run from the repo root:

```bash
corepack yarn install --immutable --mode=skip-build
corepack yarn workspace web typecheck
corepack yarn workspace web exec vitest run src/lib/game/actions.test.ts
corepack yarn workspace mobile exec tsc --noEmit
corepack yarn workspace web build
corepack yarn workspace mobile exec expo config --type public
```

Then create the production Android bundle:

```bash
cd apps/mobile
eas build --platform android --profile production
```

The web game must be deployed before building the mobile app. Set one of these production env vars
for the mobile build, in this order of preference:

- `EXPO_PUBLIC_GAME_URL`
- `EXPO_PUBLIC_APP_URL`
- `EXPO_PUBLIC_BASE_URL`

The URL must be HTTPS and should resolve to the deployed web app. The mobile shell will open `/game`
automatically if the URL points at the site root.
