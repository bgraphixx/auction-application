# PRD: Asset Disposal and Auction Management System

## 1. Product Overview

An internal web application that allows a company to dispose of assets through a fair, transparent, auditable auction process.

The system is for employees only. Employees can browse company-approved assets, check auction eligibility, place bids, watch auctions, upload payment proof after winning, and track pickup status.

Internal teams use the system to manage listings, approvals, payment verification, pickup scheduling, compliance review, disputes, and reports.

## 2. Product Goal

Create a controlled internal asset disposal platform that uses auctions to make company asset sales fair, transparent, and auditable.

The app should reduce manual coordination through emails, spreadsheets, phone calls, and informal approvals.

## 3. Target Users

### Employee

Can browse assets, check eligibility, bid, watch auctions, upload payment proof, track pickup, and submit disputes.

### Auction Admin

Creates auction listings, configures auction rules, reviews winners, manages auction lifecycle, and handles exceptions.

### Finance

Reviews uploaded payment proof, verifies offline bank transfer against bank records, and marks payment as accepted or rejected.

### Facilities

Schedules pickup after payment confirmation, marks pickup as completed, and uploads handover evidence.

### Compliance

Reviews audit logs, disputes, sensitive asset controls, and fairness concerns.

### Super Admin

Manages roles, permissions, employee profile data, categories, and system settings.

## 4. Core Workflow

The auction lifecycle must follow this state model:

```text
Draft
-> Pending Approval
-> Live
-> Highest Bid Pending Approval
-> Approved Winner
-> Payment Pending
-> Paid
-> Pickup Scheduled
-> Picked Up
-> Closed
```

## 5. MVP Scope

### Included In MVP

- Employee authentication
- Role-based access control
- Employee profile with ID and job grade
- Auction catalog
- Search, filters, sorting, and watchlist
- Auction detail page
- Bidding
- Anonymous bid count and highest bid display
- Admin listing creation
- Auction rule configuration
- Eligibility rules by employee profile data
- Winner approval workflow
- Offline payment proof upload
- Finance payment verification
- Facilities pickup scheduling
- Pickup completion evidence
- Dispute/appeal submission
- Compliance audit trail
- Reports dashboard
- Notifications by in-app and email

### Excluded From MVP

- Public/external buyers
- Online card/payment gateway
- Payroll deduction
- Delivery/shipping workflow
- AI price recommendations
- Native mobile app
- Asset register integration
- Public marketplace features

## 6. Employee Profile Data

Each employee must have:

- Full name
- Company email
- Employee ID number
- Job grade
- Department
- Location/branch
- Employment status
- Account status
- Bid history
- Win history
- Unpaid win/default history

Employee ID and Job Grade must not be freely editable by employees. They should be controlled by Super Admin or imported later from HR/admin records.

## 7. Auction Eligibility Rules

Auction Admins must be able to configure eligibility per auction using:

- Job grade
- Department
- Location/branch
- Employment status
- Previous unpaid wins
- Maximum wins per auction
- Category restrictions

Employees must see eligibility before bidding.

Example states:

```text
You are eligible to bid.
```

```text
You are not eligible. This auction is limited to Grade M3 and above.
```

If an employee is not eligible, the bid action must be disabled and the reason must be shown.

## 8. Asset Categories

The system must support mixed asset categories from day one:

- Electronics / IT equipment
- Furniture
- Vehicles
- Machinery / equipment
- Inventory / stock items
- Scrap / damaged assets

Bundles/lots are allowed only for inventory and scrap.

For lots, listings must include:

- Item list when known
- Quantity estimate
- Condition note
- Photos
- Exclusions

## 9. Listing Requirements

An auction listing should include:

- Asset title
- Asset category
- Description
- Asset tag or temporary auction reference ID
- Condition label
- Condition notes
- Known defects
- Photos
- Location
- Pickup rules
- Payment rules
- Auction start date/time
- Auction end date/time
- Starting price
- Optional reserve price
- Bid increment
- Anti-sniping setting
- Payment deadline
- Pickup deadline
- Eligibility rules
- Sensitive asset flags
- Attachments/documents where needed

If no asset tag exists, admin must create a temporary reference ID and provide reason/photo evidence.

## 10. Photo Requirements

Minimum: at least one photo is required.

The UI should show category-specific photo suggestions, for example:

- Laptop: front, back, screen, ports, serial/spec label
- Vehicle: exterior, interior, odometer, engine bay, documents where allowed
- Furniture: front, side, damage/defect closeups
- Machinery: full view, control panel, model plate, defects
- Scrap/inventory lot: overview photo, quantity/contents photo, defects

## 11. Sensitive Asset Controls

Special controls apply to:

- Laptops, phones, drives, and storage devices
- Vehicles
- Financial documents or archived records
- Branded uniforms, ID materials, or access-related assets
- High-value assets above a configured threshold

For IT/storage devices, require:

- IT wipe confirmation
- Wipe certificate or proof upload

Sensitive-asset checks must be visible in the admin workflow and audit trail.

## 12. Bidding Rules

During a live auction, employees should see:

- Current highest bid
- Anonymous bid count
- Time remaining
- Their own bid status
- Eligibility status
- Bid increment
- Payment deadline
- Pickup deadline

Employees should not see bidder names.

After auction closes, employees may see:

- Anonymous bid timeline
- Fairness summary
- Final amount
- Bid count
- Closing time
- Winner status

Before admin approval, never label the result as "Won." Use:

```text
Highest bid pending approval
```

## 13. Winner Approval

Auction Admin reviews every winner.

Approval checklist should include:

- Highest bidder confirmation
- Bidder eligibility
- Reserve/minimum price check
- Unpaid previous wins check
- Rule violation check
- Asset availability check
- Payment/pickup readiness

Allowed rejection reasons:

- Bidder is not eligible
- Reserve/minimum price not met
- Bidder has unpaid previous wins
- Bidder violated auction rules
- Asset withdrawn or unavailable
- Payment/pickup risk

Do not allow arbitrary rejection such as "admin prefers another bidder."

If winner is rejected or fails payment, the system should recommend the next eligible bidder for admin confirmation.

## 14. Payment Workflow

Payment is offline bank transfer in MVP.

Flow:

1. Winner receives payment instructions.
2. Winner uploads payment proof/receipt.
3. Finance reviews proof.
4. Finance verifies against bank records.
5. Finance marks payment as accepted or rejected.
6. If accepted, auction moves to Paid.
7. If rejected, winner is notified and may resubmit before deadline.

Payment record should include:

- Amount
- Receipt/proof file
- Submission time
- Finance reviewer
- Verification status
- Rejection reason, if rejected
- Verification timestamp

## 15. Pickup Workflow

Facilities schedules pickup only after payment is confirmed.

Flow:

1. Payment confirmed.
2. Facilities provides available pickup slots.
3. Winner selects or receives a pickup slot.
4. Facilities confirms pickup schedule.
5. Winner collects asset.
6. Facilities marks pickup complete.
7. Facilities uploads handover evidence.
8. Winner acknowledgement should be captured where possible.
9. Auction closes.

Pickup evidence may include:

- Staff confirmation
- Timestamp
- Handover photo/document
- Winner acknowledgement

If winner does not pick up, system sends reminders and escalates according to configured rules.

## 16. Disputes And Appeals

Employees can submit disputes/appeals inside the app.

Disputes are visible to:

- Auction Admin
- Compliance/Audit

Possible dispute outcomes:

- Dismiss dispute
- Correct listing information
- Extend auction
- Cancel auction
- Reverse winner approval
- Escalate to compliance/management
- Refund payment

Disputes must be logged in the audit trail.

## 17. Notifications

Support in-app and email notifications.

MVP notification types:

- Outbid
- Auction closing soon
- Highest bidder pending approval
- Winner approved
- Payment proof accepted/rejected
- Pickup scheduled
- Pickup reminder
- Auction cancelled
- Dispute/update resolution

## 18. Reports Dashboard

Primary management headline metric:

- Time from listing to pickup

Supporting reports:

- Assets listed/sold/unsold
- Payment delays and defaults
- Winner approval/rejection reasons
- Revenue recovered
- Employee trust/satisfaction ratings

Reports should be filterable by:

- Date range
- Asset category
- Department
- Location
- Auction status

## 19. Audit Trail

Audit trail must record:

- Listing creation
- Listing edits
- Auction publish action
- Bids
- Winner approval/rejection
- Payment proof upload
- Finance verification
- Pickup scheduling
- Pickup completion
- Disputes and dispute outcomes
- Auction cancellation
- State transitions

Each audit record should include:

- Actor
- Role
- Action
- Timestamp
- Previous value where applicable
- New value where applicable
- Reason/comment where applicable

## 20. Core Screens

### Employee Screens

1. Employee dashboard
2. Auction catalog
3. Auction detail page
4. Bid confirmation modal
5. Watchlist
6. My bids
7. My won/pending items
8. Payment proof upload page
9. Pickup status page
10. Dispute submission page

### Admin Screens

1. Admin dashboard / pipeline board
2. Create auction listing form
3. Edit auction listing form
4. Auction rule configuration
5. Winner approval page
6. Auction cancellation flow
7. Dispute review page

### Finance Screens

1. Payment verification queue
2. Payment verification detail page

### Facilities Screens

1. Pickup scheduling queue
2. Pickup handover/completion page

### Compliance Screens

1. Audit trail page
2. Dispute log
3. Sensitive asset review page

### Super Admin Screens

1. User management
2. Role management
3. Employee profile management
4. Asset category management
5. System settings

## 21. Design Requirements

The interface should feel:

- Clean
- Operational
- Trustworthy
- Corporate
- Easy to scan
- Status-driven

Avoid:

- Explainatory copy
- Flashy public marketplace styling
- E-commerce gimmicks
- Confusing winner labels
- Hidden fees/rules
- Weak listing hierarchy
- Overly decorative dashboards

Important UI principles:

- Always show the next required action.
- Always show auction status clearly.
- Always show eligibility before bidding.
- Always distinguish "highest bid" from "approved winner."
- Keep bid, payment, and pickup rules visible.
- Make admin workflows feel like an operations pipeline.

## 22. Success Metrics

The system is successful if:

- Average time from listing to pickup decreases
- Fewer assets remain stuck after auction close
- Payment defaults are visible and manageable
- Employees report that auctions feel fair
- Admins can prove winner decisions through audit logs
- Finance and facilities have fewer manual follow-ups

## 23. Key Acceptance Criteria

- Employees can only bid when eligible.
- Ineligible employees see a clear reason.
- Bidders remain anonymous to other employees.
- Admin can configure auction rules per listing.
- Highest bidder is shown as "Highest bid pending approval" before admin approval.
- Finance can verify offline payment proof.
- Facilities can schedule and complete pickup.
- Every important state transition is logged.
- Compliance can review bid history, approvals, disputes, and sensitive asset checks.
- Reports show time from listing to pickup and process bottlenecks.

## 24. Technical Architecture And Deployment

The MVP should be implemented as a lean, maintainable internal application. Avoid adding distributed services until operational volume or reliability requirements make them necessary.

### Application Stack

- **Application:** Next.js with TypeScript. The web interface, authenticated server-side actions/API routes, and core auction logic live in one codebase and deployment unit.
- **Database:** PostgreSQL, accessed through Prisma for schema migrations and type-safe database access.
- **Authentication and authorization:** Better Auth with role-based access control for Employee, Auction Admin, Finance, Facilities, Compliance, and Super Admin roles. Company SSO can be added later.
- **Object storage:** DigitalOcean Spaces for asset photos, payment proofs, IT wipe certificates, attachments, and pickup handover evidence.
- **Transactional email:** ZeptoMail for auction, payment, pickup, and dispute notifications.

### Containerisation And Hosting

- The application must be Dockerised using a multi-stage production Dockerfile.
- The application container must run as a non-root user.
- Deploy the Docker image to a company VPS managed through Dokploy.
- Dokploy will provide build/deploy automation, runtime environment variables, HTTPS/domain routing, and application lifecycle management.
- PostgreSQL may initially run as a managed database or as a dedicated Dokploy-managed container on the VPS. Database backups must be configured before production use.
- DigitalOcean Spaces and ZeptoMail remain external managed services; files and email delivery are not hosted inside the application container.

### Scheduled Work

Use a secured scheduled endpoint invoked by Dokploy's scheduler (or host cron) for MVP automation:

- Close auctions when their end time is reached.
- Apply configured anti-sniping extensions.
- Send auction-closing, payment-deadline, and pickup-reminder notifications.
- Escalate overdue payment or pickup actions according to configured rules.

Protect scheduled endpoints with a `CRON_SECRET`. Redis and a background-job queue are intentionally out of scope for the initial release; introduce them only when delivery volume, retry needs, or workload duration requires a dedicated worker.

### Required Runtime Configuration

```text
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
DO_SPACES_ENDPOINT=
DO_SPACES_REGION=
DO_SPACES_BUCKET=
DO_SPACES_KEY=
DO_SPACES_SECRET=
ZEPTO_MAIL_API_KEY=
ZEPTO_MAIL_FROM=
CRON_SECRET=
```
