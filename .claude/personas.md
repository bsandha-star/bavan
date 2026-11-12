# Personas for /sim-test (Huddle marketing site)
Run against the local preview only (see CLAUDE.md, Preview locally): http://127.0.0.1:8080/ . Never huddle.dental,
bsandha-star.github.io or any other published copy. No sign-in. Fake data only ("Test Visitor 01", test@example.com).

The "Book a demo" form (`#demoForm`, end of `index.html`) has no `action` and no endpoint: `assets/app.js` stops the
submit, checks the required fields and only shows the thank-you message (`data-sent="true"`). Nothing leaves the
browser (`tests/smoke.mjs` checks that no request is made). If a change ever wires up a real endpoint, sim tests must
stop before the final submit and say so.
The "Sign in" button goes to the live app (app.huddle.dental): note that it exists, never follow it.
`green-valley-map-r8q4.html` is not part of the marketing site; leave it out of sim tests.

## 1. Dental group owner evaluating Huddle · desktop 1366×900 · slug `group-owner`
Owns six practices, reads on a laptop in the evening, sceptical of AI claims, wants to know "what does it do for me".
- From the top of `/`, explain in one sentence what Workspace and Pulse each are, using only the hero and "Products".
- Press "Work this queue" in the hero demo and say what happened and whether it is clear the demo is a simulation.
- Find which practice-management systems Huddle works with (Integrations) and whether the page says which are live.
- Book a demo with fake details (4–9 practices, Owner / dentist); confirm the thank-you message and that the page
  did not reload or go anywhere.

## 2. Office manager on her phone · phone 412×915 · slug `office-manager-phone`
Between patients, one thumb, dark mode on. Heard about Huddle from another office; wants to know if it saves her time.
- Open the menu, go to "Workspace", and find the six themes; check nothing needs sideways scrolling.
- Find the before/after day section and name one chore it says goes away.
- Open two FAQ answers; check they open and close and are readable in dark mode.
- Submit the form with the email left empty: is the missing field obvious and focused? Then fix it and submit.

## 3. CFO / finance lead skimming pricing and security · desktop 1366×900 · slug `cfo`
Short on time, jumps straight to numbers and risk. Will forward the page to counsel.
- Reach Pricing from the nav in one click and say what each plan costs and what it is billed per.
- In Security, find what the page says about the BAA, encryption, roles and owners-only Pulse; note any claim that
  reads as a promise counsel would need to check.
- Open Privacy and Terms from the footer; say whether it is clear they are placeholders, and get back to the site.

## 4. Keyboard-only screen-reader user · desktop 1366×900 · slug `keyboard`
Uses Tab, Shift+Tab, Enter, Space and Escape only; relies on visible focus and accessible names (read the snapshot).
- Tab from the top: is there a skip link or a quick way to the content; is focus always visible?
- Reach and run "Work this queue" with the keyboard; is the result announced or at least readable in the snapshot?
- Fill and submit the demo form with the keyboard only; are labels read for every field, and is the thank-you
  message announced (role="status")?
- At phone width (412×915), open and close the menu with the keyboard; does `aria-expanded` change?

## 5. Careless form filler · phone 412×915 · slug `careless`
In a hurry, double-taps, types junk, ignores hints.
- Submit the demo form completely empty, then with `not-an-email` as the email; is each problem shown and explained?
- Fill it, then tap "Request my demo" twice quickly; does anything break or show twice?
- Paste a very long practice name (300+ characters) and a multi-line note; does the layout hold on the phone?
- Rotate to landscape (915×412) mid-form; does the form stay usable?
