# Utsarg NGO Platform — Complete Documentation

> **Connecting Hearts, Creating Impact**
> A full-stack web platform connecting NGOs, Donors, and Volunteers with transparency, verification, and real-time tracking.

**Stack:** Next.js 15.5.4 (App Router) + React 19.1 + Tailwind CSS 4 + Supabase (PostgreSQL) + Custom JWT Auth + Razorpay + Nodemailer + jsPDF + Recharts
**Project:** `ngo-platform/` | **Brand:** Utsarg

---

## Table of Contents

1. [Overview & Roles](#1-overview--roles)
2. [Public / Visitor Features](#2-public--visitor-features)
3. [Authentication & Onboarding](#3-authentication--onboarding)
4. [NGO Features](#4-ngo-features)
5. [Donor Features](#5-donor-features)
6. [Volunteer Features](#6-volunteer-features)
7. [Super Admin Features](#7-super-admin-features)
8. [Cross-Cutting Systems](#8-cross-cutting-systems)
9. [Page / Route Map](#9-page--route-map)
10. [API Reference](#10-api-reference)
11. [Database Schema](#11-database-schema)
12. [Integrations](#12-integrations)
13. [Core Workflows](#13-core-workflows)
14. [Setup & Configuration](#14-setup--configuration)
15. [Project Structure](#15-project-structure)

---

## 1. Overview & Roles

| Role | Description | Access |
|------|-------------|--------|
| **Public Visitor** | Browse campaigns, NGOs, leaderboard, transparency reports. Can donate as guest. | `/`, `/campaigns`, `/ngos`, `/leaderboard`, `/donate`, `/about`, `/contact`, legal pages |
| **NGO** | Registers with DARPAN ID, needs admin approval, then creates campaigns, manages donations/volunteers/beneficiaries/reports. | `/ngo/*` |
| **Donor** | Donates money / clothes / food / blood, tracks history, saves campaigns, views impact reports, rates NGOs. | `/donor/*` |
| **Volunteer** | Discovers opportunities by city/state, applies with message, tracks applications, logs hours. | `/volunteer/*` |
| **Super Admin** (`super_admin`, alias `admin`) | Verifies NGOs, moderates users/campaigns/donations/volunteers, views analytics, exports CSV. | `/admin/*` |

Role enforcement: `hooks/useAuth.js` (client guard + `localStorage` JWT decode + expiry) + per-API JWT verification + DB `user_type` re-check. Role redirects after login: `super_admin/admin → /admin/dashboard`, `ngo → /ngo/dashboard`, `donor → /donor/dashboard`, `volunteer → /volunteer/dashboard`, with `?redirect=` support.

---

## 2. Public / Visitor Features

### 2.1 Landing Page (`/`)
- Hero: "Connecting Hearts, Creating Impact" + CTAs `Get Started` / `Browse Campaigns`
- Live stats band: funds raised, NGOs, donors, volunteers
- 6 feature cards: Verified NGOs (DARPAN), Real-time tracking, Multi-type help (money/clothes/food/blood/volunteer), Targeted campaigns, Razorpay secure payments, Community
- Verified NGOs showcase section
- 3-step How It Works: Register → Create / Find → Impact
- Role CTA cards linking to `/register?type=ngo|donor|volunteer`

### 2.2 Campaign Discovery (`/campaigns`, `/campaigns/[id]`)
- List via `GET /api/campaigns` with:
  - Text search (title/description)
  - Category filter: Education, Healthcare, Environment, Disaster Relief, Poverty, Women, Child, Elderly, Animal (10 categories incl. Others)
  - Type filter: `money | clothes | food | blood | volunteer | other`
  - Progress bars: `₹ raised vs goal` (money) or `items collected vs target` (in-kind)
  - `Days left` countdown, `expiring-soon (≤7d)` badge
- Detail page:
  - Cover image, title, category, dates, location, status badge (`active/completed/draft/cancelled`)
  - Full description, NGO card (logo, description, website link)
  - Sidebar: % funded, raised/goal, donor count, `Donate Now → /donate/[id]` (login guard with redirect), `View Transparency Reports`
  - Share button (Web Share API → clipboard fallback)

### 2.3 NGO Directory (`/ngos`, `/ngos/[id]`, `/ngo/[id]`)
- Paginated directory `GET /api/ngos?page&limit&search&city&state&category`
- Filters: name/DARPAN search, city/state (StateCitySelector), NPO type (Trust / Society / Section 8 / Foundation / Cooperative, etc.)
- Star ratings from `ngo_rating_summary`
- Public NGO profile: name, description, DARPAN ID, npo_type, district/state, phone, address, website, logo, active campaigns, feedback/ratings list

### 2.4 Leaderboard (`/leaderboard`)
- `GET /api/leaderboard?limit&minRatings&category`
- Rank icons (Trophy/Medal/Award), stars, `average_rating`, `total_ratings`, donor/volunteer/general breakdown
- Filters: Top 10/20/50/100 + min ratings 1/5/10/25/50
- Stats header: total NGOs, rated NGOs, qualified NGOs

### 2.5 Donation Checkout (`/donate/[id]`, `/donate/[id]/success`)
- Prefills donor profile via `GET /api/donor/profile` (if logged in)
- Validates: money min ₹10, in-kind estimated value + quantity
- Collects: name/email/phone/address, anonymous toggle, message
- `POST /api/donations/create` → Razorpay order → Razorpay Checkout modal (`checkout.razorpay.com`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, amount in paise, prefill, notes `campaign_id`) → `PUT /api/donations/[id]` signature verify → success page with receipt
- Guest donation allowed: creates orphan `donor_profiles (user_id=null)` linked later by email

### 2.6 Transparency Reports (public) (`/campaigns/[id]/reports`)
- Lists published `campaign_reports` via `GET /api/campaigns/[id]/reports`
- Report types: `utilization | progress | completion`
- Shows amount/items utilized, expense table, achievements/challenges/next_steps, images/documents, PDF download

### 2.7 Static / Trust Pages
- `/about`, `/contact` (contact form), `/privacy`, `/terms`, `/cookies` + `CookieConsent` banner
- `FloatingFeedbackButton` + `QuickRating` available site-wide
- `/setup-admin` — bootstrap first super_admin account

---

## 3. Authentication & Onboarding

Pages: `/register`, `/login`, `/verify-email`, `/forgot-password`, `/reset-password?token=`

### 3.1 Registration (`POST /api/auth/register`)
1. Duplicate email check
2. `hashPassword` (bcrypt, 12 rounds), 6-digit OTP (`otp_expires_at = now + 15m`)
3. `users.is_approved = true` for all except NGO (`false` → needs admin)
4. Insert role profile:
   - **NGO:** `ngo_name, darpan_id (UNIQUE, required), npo_type (12 types), registered_state/district (StateCitySelector), contact_person/phone/address/website/description (optional)`
   - **Donor:** `full_name, phone, state/city/address, preferred_causes[] (checkboxes), blood_group`
   - **Volunteer:** `full_name, phone, state/city/address, skills[] (Teaching/Healthcare/Tech/Marketing/Events/Fundraising/Social/Photography/Writing/Translation/Legal/Accounting), availability, experience`
5. Rollback `users` row if profile insert fails
6. `sendOTPEmail` + if NGO → admin notification email (DARPAN, contact, location + dashboard link)
7. Redirect → `/verify-email?email=`

City handling: `city.json` as source of truth, `normalizeCityName` strips diacritics (`Bhānder → Bhander`), `removeDuplicates`, `processCities`. Data source: CountriesNow API → internal `/api/locations/*` fallback → hardcoded states.

### 3.2 OTP Verification (`POST /api/auth/verify-otp`, `POST /api/auth/resend-otp`)
- 6-digit input UI, resend with cooldown
- On success: `is_verified=true`, clear OTP, issue JWT, `sendWelcomeEmail`

### 3.3 Login (`POST /api/auth/login`)
- `bcryptjs.compare`, errors:
  - `401` wrong credentials
  - `Please verify your email first` if `!is_verified`
  - `pending admin approval` if `ngo && !is_approved`
- JWT 7d payload: `{userId, email, user_type + userType, isVerified, isApproved}` (`JWT_SECRET`)
- Client stores in `localStorage + cookie (7d)`, demo accounts box on login page

### 3.4 Password Reset
- `POST /api/auth/forgot-password` → generic success (anti-enumeration), `generateResetToken` (crypto 32B hex, 1h expiry, `reset_token` column), email link `${APP_URL}/reset-password?token=`
- `POST /api/auth/verify-reset-token` → validate
- `POST /api/auth/reset-password` → min 6 chars, `hashPassword`, clear token
- `GET /api/auth/verify` (`Authorization: Bearer`) → `{role, userType, ...}` for guards

---

## 4. NGO Features

Gate: if `!isApproved` → yellow `Verification Pending` banner, dashboards locked until approval.

### 4.1 Dashboard (`/ngo/dashboard` ← `GET /api/ngo/dashboard?userId=`)
- Stats: total/active campaigns, totalRaised (₹), donors + volunteers, pendingVolunteers
- Recent campaigns with progress bars
- Pending volunteer list (quick approve)
- Quick Actions: Create Campaign / View Donations / Manage Volunteers / Reports

### 4.2 Campaign Management (`/ngo/campaigns`, `/create`, `/edit/[id]` ← `GET/POST/PUT/DELETE /api/ngo/campaigns`)
- Stats: total/active/raised/success %
- Search + status filter (`draft/active/completed/cancelled`), View/Edit/Delete
- Delete blocked if donations exist → suggests cancel instead
- Create/Edit form:
  - Type: `money/clothes/food/blood/other` with icons
  - Category (10), `goal_amount` vs `target_quantity + unit`
  - `StateCitySelector`, start/end validation (no past start, end > start)
  - `image_url` (FileUpload), requirements/terms
  - `Save Draft (status=draft)` vs `Publish (status=active)`

### 4.3 Donations (`/ngo/donations` ← `GET /api/ngo/donations`)
- Table of all donations to own campaigns: donor name/email, type, amount/quantity, `payment_status (pending/completed/failed)`, `delivery_status (pending/collected/delivered)`, Razorpay IDs, dates

### 4.4 Volunteers (`/ngo/volunteers` ← `GET /api/ngo/volunteers`, `POST /api/ngo/volunteers/update-status`)
- Stats: total/active/pending/hours
- Search + status filter, Accept/Reject with message, hours tracking

### 4.5 Beneficiaries (`/ngo/campaigns/beneficiaries` ← `GET/POST /api/ngo/campaigns/beneficiaries`, `GET/PUT/DELETE /beneficiaries/[id]`)
- CRUD beneficiaries per campaign for impact tracking (name, details, aid provided)

### 4.6 Transparency Reports (`/ngo/campaigns/reports`, `/create`, `/edit/[id]`, `/[id]` ← `GET/POST /api/ngo/campaigns/reports`, `GET/PUT/DELETE /reports/[id]`)
- Fields: `report_type`, title/description, `amount_utilized/items_utilized`, `expenses JSONB [{category, amount, description, bill}]`, achievements/challenges/next_steps, images/documents, `is_published/published_at`
- Search + campaign/status filters, Publish/Unpublish, PDF download via `downloadReportPDF()` (`lib/pdfGenerator.js` + jsPDF + autotable: header, info, utilization table, expense breakdown + total, narrative sections, paginated footer)

### 4.7 Profile (`/ngo/profile` ← `GET/PUT /api/ngo/profile`)
- Edit `ngo_profiles`: name, npo_type, state/district, contact/phone/address/website/logo/description/documents (DARPAN ID read-only)
- View own feedback/ratings

---

## 5. Donor Features

### 5.1 Dashboard (`/donor/dashboard` ← `GET /api/donor/dashboard` + `dashboard-new` variant)
- Auto-repairs orphaned profiles (links by email)
- Stats: totalDonated (₹), campaignsSupported, `impactScore = floor(total/1000) + 5*campaigns`, thisMonth total
- Recent donations list
- Recommended campaigns (excludes already-donated, prioritizes `preferred_causes`, active + future `end_date`)
- Impact section: `livesImpacted = score*10`, goals completed, tier `Bronze <10k / Silver <50k / Gold`

### 5.2 Donation History (`/donor/donations` ← `GET /api/donor/donations`, `POST` for in-kind)
- Full history with `razorpay_payment_id`, status badges, campaign links

### 5.3 Browse & Saved (`/donor/campaigns` ← `GET /api/donor/campaigns`, `/donor/saved-campaigns` ← `GET/POST/DELETE /api/donor/saved-campaigns`)
- Browse with `saved` flag from `saved_campaigns` wishlist
- Save/Unsave (wishlist page)

### 5.4 Impact Reports (`/donor/reports` ← `GET /api/donor/reports?months=`, `GET /api/donor/export`)
- Summary: total/campaigns/score/lives, monthlyTrends, categoryBreakdown, impactStories, topCampaigns, geographicImpact, 12-month range selector
- Export CSV/PDF (Recharts placeholders ready for charts)

### 5.5 Profile (`/donor/profile` ← `GET/PUT /api/donor/profile`)
- `full_name, phone, address, blood_group, preferred_causes`

### 5.6 Feedback
- Rate NGOs via `FeedbackForm` (stars 1–5, category, ≥10 chars, anonymous toggle) → counts as `donor_ratings` in leaderboard

---

## 6. Volunteer Features

### 6.1 Dashboard (`/volunteer/dashboard` ← `GET /api/volunteer/dashboard`)
- Stats: activeApplications, approvedApplications, hoursVolunteered
- Recent applications (ngo_name/message/status), available opportunities (approved NGOs only)

### 6.2 Opportunities (`/volunteer/opportunities`, `/opportunities/[id]` ← `GET /api/volunteer/opportunities?city&state`)
- Search/filter by city/state, campaign/NGO cards, detail view, `Apply with message` (`POST /api/volunteer/apply {ngo_id|campaign_id, message}`)

### 6.3 Applications (`/volunteer/applications`, `/applications/[id]` ← `GET /api/volunteer/applications`, `GET /applications/[id]`)
- Status tracking: `pending/approved/rejected` (NGO applications) and `applied/accepted/completed` (campaign registrations) + hours_contributed

### 6.4 Profile (`/volunteer/profile` ← `GET/PUT /api/volunteer/profile`)
- `full_name, phone, address, skills[], availability, experience`

Dual volunteering model: `volunteer_applications (volunteer_id→users, ngo_id, UNIQUE(volunteer,ngo))` for direct-to-NGO vs `volunteer_registrations (volunteer_id→volunteer_profiles, campaign_id, hours_contributed)` for campaign volunteering.

---

## 7. Super Admin Features

Sidebar via `DashboardLayout` (admin/super_admin). All APIs require JWT `super_admin/admin`.

### 7.1 Dashboard (`/admin/dashboard` ← `GET /api/admin/dashboard`)
- Stats: totalUsers/active, totalNGOs/verified, totalCampaigns, totalDonations (₹)
- Pending NGO alert with inline Approve/Reject (`POST /api/admin/verify-ngo {ngoId, action:approve/reject, notes}`)
- Recent activity feed, health metrics (verification %, engagement %, success %, response time)

### 7.2 NGO Verification (`/admin/ngos` ← `GET /api/admin/ngos`)
- Search by name/DARPAN/contact, status filter (`pending/approved/rejected`)
- Detail modal (DARPAN, docs, contact, location), Approve/Reject with `verificationNotes` → sets `verification_status/is_approved` + sends approval/rejection email
- DARPAN is manually reviewed (no external API); stored UNIQUE, displayed everywhere, searchable

### 7.3 User Management (`/admin/users` ← `GET /api/admin/users`, `GET/PUT /api/admin/users/ngo/[id]`)
- All users table (email, type, verified, approved, created), NGO detail view/edit

### 7.4 Moderation
- `/admin/campaigns` ← `GET /api/admin/campaigns` — all campaigns
- `/admin/donations` ← `GET /api/admin/donations` — all donations + payment/delivery status
- `/admin/volunteers` ← `GET /api/admin/volunteers` — volunteer directory
- `/admin/volunteer-applications` ← `GET /api/admin/volunteer-applications` — approve/reject

### 7.5 Analytics & Export (`/admin/reports` ← `GET /api/admin/analytics`, `GET /api/admin/export?type=`)
- User registration + donation trend charts (Recharts), CSV dump
- `POST /api/admin/create-test-admin` — seed admin (dev)

---

## 8. Cross-Cutting Systems

| System | Details |
|--------|---------|
| **Notifications** | `notifications` table + DashboardLayout Bell (placeholder list) + emails (OTP, welcome, reset, NGO-new → admin, approval/rejection) |
| **Feedback & Ratings** | `FeedbackForm` (1–5 stars, category `general/transparency/communication/impact/efficiency`, 10–1000 chars, anonymous), `FeedbackDisplay`, `FloatingFeedbackButton`, `QuickRating`; `POST /api/feedback/submit` (upsert per user+ngo) → `ngo_feedback` → aggregated `ngo_rating_summary` → leaderboard |
| **Campaign Updates** | `campaign_updates` table (title/description/images) — schema ready |
| **File Upload** | `components/ui/FileUpload.js` for campaign images, NGO logos/documents, report attachments |
| **Location** | `city.json` + `GET/POST /api/locations/states-cities` + `GET/POST /api/locations/cities` + `lib/api.js (CountriesNow proxy)` + `StateCitySelector` component |
| **UI Kit** | `Button, Card, Input, LoadingSpinner, FileUpload, StateCitySelector, Feedback*, CookieConsent` + `Header/Footer/PublicLayout/ClientLayout/DashboardLayout` + Lucide icons + react-hot-toast + HeadlessUI |
| **Exports** | `GET /api/admin/export`, `GET /api/donor/export` (CSV) + `lib/pdfGenerator.js → generateReportPDF/downloadReportPDF` (jsPDF + autotable) |
| **Debug/Test** | `/test-auth, /test-login, /test-admin, /test-cities` pages + `GET/POST /api/debug/auth`, `GET /api/debug/time` + ~60 `api/test/*` routes (seed `create-users/sample-*`, fix `fix-donor-*/fix-volunteer-*/cleanup-orphans`, debug `login-debug/jwt-debug/db-check/donations-schema`, `send-test-email`, `razorpay-order`, `approve-ngo`, `haryana-cities`, `init-db`) |

---

## 9. Page / Route Map

```
 /  /about /contact /privacy /terms /cookies
 /login /register /verify-email /forgot-password /reset-password /setup-admin
 /leaderboard /campaigns /campaigns/[id] /campaigns/[id]/reports
 /ngos /ngos/[id]  /ngo/[id] (public profile)
 /donate/[id] /donate/[id]/success
 /admin/dashboard /admin/ngos /admin/users /admin/donations /admin/campaigns
 /admin/volunteers /admin/volunteer-applications /admin/reports
 /ngo/dashboard /ngo/campaigns /ngo/campaigns/create /ngo/campaigns/edit/[id]
 /ngo/campaigns/beneficiaries /ngo/campaigns/reports (+/create, /edit/[id], /[id])
 /ngo/donations /ngo/volunteers /ngo/profile
 /donor/dashboard /donor/donations /donor/campaigns /donor/reports
 /donor/saved-campaigns /donor/profile
 /volunteer/dashboard /volunteer/opportunities /volunteer/opportunities/[id]
 /volunteer/applications /volunteer/applications/[id] /volunteer/profile
```

Components: `layout/Header, Footer, PublicLayout, ClientLayout` · `dashboard/DashboardLayout` · `ui/Button, Card, Input, LoadingSpinner, FileUpload, StateCitySelector, FeedbackForm, FeedbackDisplay, FloatingFeedbackButton, QuickRating, CookieConsent`
Lib/Hooks: `lib/auth (jwt/bcrypt/OTP/reset), supabase (anon+admin), email (nodemailer), api (locations), utils (city normalize), pdfGenerator (jsPDF)` · `hooks/useAuth` · `styles/responsive.css`

---

## 10. API Reference

**Auth:** `POST /api/auth/register | login | verify-otp | resend-otp | forgot-password | reset-password | verify-reset-token` · `GET /api/auth/verify`
**Public:** `GET(+POST) /api/campaigns` · `GET /api/campaigns/[id]` · `GET /api/campaigns/[id]/reports` · `GET /api/ngos` · `GET /api/ngos/[id]` · `GET /api/leaderboard` · `POST /api/feedback/submit` · `GET /api/feedback/[ngoId]` · `GET/POST /api/locations/states-cities` · `GET/POST /api/locations/cities` · `POST /api/donations/create` · `GET/PUT /api/donations/[id]` (HMAC verify, test `pay_test_/order_test_` bypass, increments campaign)
**Donor (JWT donor):** `GET /api/donor/dashboard (+dashboard-new)` · `GET/POST /api/donor/donations` · `GET /api/donor/campaigns` · `GET /api/donor/reports` · `GET/PUT /api/donor/profile` · `GET/POST/DELETE /api/donor/saved-campaigns` · `GET /api/donor/export`
**NGO (JWT ngo):** `GET /api/ngo/dashboard` · `GET/POST/PUT/DELETE /api/ngo/campaigns` · `GET/POST /api/ngo/campaigns/reports` · `GET/PUT/DELETE /api/ngo/campaigns/reports/[id]` · `GET/POST /api/ngo/campaigns/beneficiaries` · `GET/PUT/DELETE /api/ngo/campaigns/beneficiaries/[id]` · `GET /api/ngo/donations` · `GET/PUT /api/ngo/profile` · `GET /api/ngo/volunteers` · `POST /api/ngo/volunteers/update-status`
**Admin (JWT super_admin):** `GET /api/admin/dashboard | analytics | ngos | users | campaigns | donations | volunteers | volunteer-applications` · `GET/PUT /api/admin/users/ngo/[id]` · `POST /api/admin/verify-ngo` · `GET /api/admin/export` · `POST /api/admin/create-test-admin`
**Volunteer (JWT volunteer):** `GET /api/volunteer/dashboard | opportunities | applications` · `GET /api/volunteer/applications/[id]` · `POST /api/volunteer/apply` · `GET/PUT /api/volunteer/profile`
**Debug/Test:** `GET/POST /api/debug/auth` · `GET /api/debug/time` · `api/test/*` (~60 seed/fix/debug helpers)

---

## 11. Database Schema

Supabase PostgreSQL, UUID PKs, RLS enabled. Base: `src/lib/database-schema.sql`. Extensions: `add-campaign-reports.sql`, `add-feedback-system.sql`.

- `users(id, email UNIQUE, password_hash, user_type [ngo/donor/volunteer/super_admin], is_verified, is_approved, otp, otp_expires_at, reset_token, reset_token_expires_at, created/updated)`
- `ngo_profiles(id, user_id→users, ngo_name, darpan_id UNIQUE, npo_type, registered_state/district, description, contact_person, phone, address, website, logo_url, documents JSONB, verification_status [pending/approved/rejected], verification_notes)`
- `donor_profiles(id, user_id, full_name, phone, address, blood_group, preferred_causes JSONB, total_donated)`
- `volunteer_profiles(id, user_id, full_name, phone, address, skills JSONB, availability JSONB, experience)`
- `campaigns(id, ngo_id→ngo_profiles, title, description, category, campaign_type [money/clothes/food/blood/volunteer], target_amount/raised_amount, target_items/collected_items, start_date/end_date, location, images JSONB, status [draft/active/completed/cancelled])` + `increment_campaign_amount()` fn
- `donations(id, donor_id→donor_profiles, campaign_id, donation_type, amount, quantity, donor_name/email/phone, is_anonymous, transaction_id, razorpay_payment_id/order_id, payment_status [pending/completed/failed], payment_date/donation_date, delivery_status [pending/collected/delivered], description)`
- `volunteer_registrations(id, volunteer_id→volunteer_profiles, campaign_id, status [applied/accepted/rejected/completed], message, hours_contributed)`
- `volunteer_applications(id, volunteer_id→users, ngo_id, message, status [pending/approved/rejected], UNIQUE(volunteer,ngo))`
- `campaign_updates(id, campaign_id, title, description, images)`
- `campaign_reports(id, campaign_id, report_type [utilization/progress/completion], title, description, amount_utilized/items_utilized, expenses JSONB, achievements/challenges/next_steps, images/documents JSONB, is_published, published_at)`
- `notifications(id, user_id, title, message, type, is_read)`
- `ngo_feedback(id, ngo_id, user_id, user_type, rating 1–5, feedback_text, category, is_anonymous)`
- `ngo_rating_summary(ngo_id, average_rating, total_ratings, rating_5/4/3/2/1_count, donor/volunteer/general_ratings, last_updated)`
- `saved_campaigns(id, donor_id/user_id, campaign_id)`
- `beneficiaries(id, campaign_id/ngo_id, ... aid tracking)`

---

## 12. Integrations

| Integration | Usage |
|-------------|-------|
| **Supabase** (`@supabase/supabase-js`) | `lib/supabase.js` exports `supabase` (anon) + `supabaseAdmin` (service_role); all server queries via admin client |
| **Razorpay** (`razorpay@2.9.6` + checkout.js) | Server `orders.create(amount*100, INR, receipt, notes)` with mock `order_` fallback; client `new window.Razorpay({key, amount, order_id, handler, prefill, theme})`; verify `HMAC_SHA256(order\|payment, SECRET)`; `payment.failed` handler |
| **Nodemailer** (`7.0.9`) | `EMAIL_HOST/PORT/USER/PASS` — OTP (15m), welcome, password-reset link (1h), NGO-new → admin, approval/rejection |
| **Charts** (`recharts@3.2.1`) | Installed; monthly/category trend placeholders in donor + admin reports |
| **PDF** (`jspdf@2.5.2 + jspdf-autotable@3.8.4`) | `lib/pdfGenerator.js → generateReportPDF(report, campaign, ngoName)` + `downloadReportPDF()` |
| **Locations** | `city.json` + CountriesNow (`countriesnow.space`) primary → internal fallback → hardcoded; `lib/api.js fetchStates/fetchDistrictsByState`, `lib/utils.js processCities/normalizeCityName` |
| **UI** | `lucide-react`, `react-hot-toast`, `@headlessui/react`, Tailwind 4 |

---

## 13. Core Workflows

1. **NGO onboarding:** Register (DARPAN + location) → OTP verify → pending-approval gate → Admin approves (email) → create campaigns (draft/publish) → receive donations/volunteers → publish transparency reports (PDF) → get rated → appear on leaderboard.
2. **Donation:** Browse → detail → Donate Now → checkout (guest or login) → Razorpay order → payment → HMAC verify → `completed` + campaign increment → history + impact score + success page.
3. **Volunteering:** Discover by city/state → apply with message → NGO accepts/rejects → hours logged → tracked in dashboards; admin oversees.
4. **Transparency:** NGO creates report (expenses + bills + outcomes) → publishes → public/donor views + PDF → donor feedback → rating summary → leaderboard rank.
5. **Admin oversight:** Verify NGOs → moderate users/campaigns/donations/applications → analytics + CSV export.

---

## 14. Setup & Configuration

```bash
git clone <repo> && cd ngo-platform
npm install
# copy .env.local.example → .env.local and fill:
# NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
# JWT_SECRET (long secure) / NEXTAUTH_URL=http://localhost:3000 / NEXTAUTH_SECRET
# EMAIL_HOST=smtp.gmail.com EMAIL_PORT=587 EMAIL_USER / EMAIL_PASS (Gmail App Password)
# RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET (+ NEXT_PUBLIC_RAZORPAY_KEY_ID)
# Run src/lib/database-schema.sql (+ add-campaign-reports.sql, add-feedback-system.sql) in Supabase SQL Editor
npm run dev  # http://localhost:3000
```

Scripts: `dev (next dev --turbopack) | build | start | lint`. Deploy: Vercel (recommended) / Netlify / Railway / DigitalOcean / Amplify + env vars.
Gmail setup: enable 2FA → App Password → use as `EMAIL_PASS`. Razorpay: Key ID/Secret from dashboard.

---

## 15. Project Structure

```
ngo-platform/
├── src/app/          # pages + API routes (admin/ngo/donor/volunteer/public/auth/api)
├── src/components/   # layout/ + dashboard/ + ui/
├── src/lib/          # supabase, auth, email, api, utils, pdfGenerator, database-schema.sql
├── src/hooks/        # useAuth
├── src/styles/       # responsive.css
├── public/           # static assets
├── city.json  add-campaign-reports.sql  add-feedback-system.sql  *.sql
└── package.json next.config.mjs tailwind.config.js eslint.config.mjs
```

Root SQL helpers: `add-campaign-reports.sql`, `add-feedback-system.sql`, `fix-orphaned-profiles.sql`, `create-test-admin.sql`.
