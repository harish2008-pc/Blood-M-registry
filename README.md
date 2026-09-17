# Blood Connect

Build a polished, full-stack web app called "Blood Management Registry" (not a customer-support app).

Purpose: maintain a consent-based directory of blood donors and make it fast to find available donors in an emergency by blood group and nearby area.

Build these features:
- A calm, trustworthy responsive dashboard with a prominent “Find a donor” emergency search.
- Search filters: blood group (A+, A-, B+, B-, AB+, AB-, O+, O-), locality/area, city, availability status, and optional distance/location input. Show clear matching results sorted by availability and closeness; do not claim clinical compatibility—show a brief notice to confirm compatibility with a qualified medical professional/blood bank.
- A donor registration form with full name, address/locality, city, contact number, optional email, blood group, availability (Available / Temporarily unavailable), last donation date, consent checkbox, and emergency contact preference.
- Donor profile/detail view with a safe contact action: hide the full phone number until the user deliberately clicks “Reveal contact”; add a report/incorrect-data option.
- Admin-only dashboard to review, edit, verify, deactivate, and export registry records; use role-aware auth. Public users can search only.
- Donor portal so a donor can sign in, update their availability/contact details, and withdraw consent/delete their profile.
- Use a real persistent database with proper schema and row-level access policies. Seed clearly labelled demo records only; never represent them as real people.
- Protect privacy: explain consent, avoid exposing personal details in search results by default, show a privacy notice, and include emergency guidance to contact local emergency services/blood banks.
- Include empty states, validation, accessible labels, mobile-first layout, tasteful red/crimson accents, and a simple information page describing how it works.
- Do not include AI chat/support features unless used solely for a future optional admin insight panel.
Start with a working demo and ensure all essential screens and flows are connected.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://pledge-aid.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3ae611ae-c270-4cc5-b930-6a2a3737bfec).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
