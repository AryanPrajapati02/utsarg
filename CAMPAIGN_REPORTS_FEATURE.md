# Campaign Reports Feature

This feature adds transparency reporting capabilities to the NGO platform, allowing NGOs to submit detailed reports about how campaign funds and resources are being utilized.

## Features Added

### 1. Database Schema
- **campaign_reports table**: Stores detailed transparency reports for campaigns
- **Fields include**: 
  - Report type (utilization, progress, completion)
  - Amount/items utilized
  - Expense breakdown with categories and bill attachments
  - Achievements, challenges, and next steps
  - Images and documents for proof
  - Publishing status for transparency

### 2. API Endpoints

#### NGO Endpoints (Protected)
- `GET /api/ngo/campaigns/reports` - List all reports for NGO's campaigns
- `POST /api/ngo/campaigns/reports` - Create a new campaign report
- `GET /api/ngo/campaigns/reports/[id]` - Get specific report details
- `PUT /api/ngo/campaigns/reports/[id]` - Update a report
- `DELETE /api/ngo/campaigns/reports/[id]` - Delete a report

#### Public Endpoints
- `GET /api/campaigns/[id]/reports` - View published reports for a campaign (public transparency)

### 3. NGO Interface

#### Reports Management (`/ngo/campaigns/reports`)
- Dashboard showing all campaign reports
- Filter by campaign, status (published/draft)
- Search functionality
- Statistics overview (total reports, published, drafts)

#### Create Report (`/ngo/campaigns/reports/create`)
- Form to create detailed transparency reports
- Select campaign to report on
- Choose report type (utilization, progress, completion)
- Add expense breakdown with categories and bill uploads
- Upload bills/receipts (images, PDFs) for each expense
- Include achievements, challenges, next steps
- Option to publish immediately or save as draft

### 4. Public Transparency Interface

#### Campaign Reports Page (`/campaigns/[id]/reports`)
- Public page showing all published reports for a campaign
- Campaign overview with fundraising progress
- List of published reports with filtering
- Detailed report view with:
  - Utilization summary
  - Expense breakdown with bill attachments
  - Clickable bills/receipts for verification
  - Achievements and challenges
  - Supporting images and documents

### 5. Integration Points

#### Campaign Details Page
- Added "View Transparency Reports" button
- Links to public reports page for transparency

#### NGO Dashboard
- Added "Campaign Reports" quick action
- Links to reports management interface

## Database Migration

To set up the campaign reports feature, run the SQL in `add-campaign-reports.sql`:

```sql
-- Add campaign reports table for transparency
CREATE TABLE IF NOT EXISTS campaign_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  report_type VARCHAR(20) DEFAULT 'utilization' CHECK (report_type IN ('utilization', 'progress', 'completion')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  amount_utilized DECIMAL(12,2),
  items_utilized INTEGER,
  expenses JSONB,
  achievements TEXT,
  challenges TEXT,
  next_steps TEXT,
  images JSONB,
  documents JSONB,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaign_reports_campaign_id ON campaign_reports(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_reports_published ON campaign_reports(is_published);

-- Enable Row Level Security
ALTER TABLE campaign_reports ENABLE ROW LEVEL SECURITY;
```

## Usage Flow

### For NGOs:
1. Navigate to "Campaign Reports" from dashboard
2. Click "Create Report" 
3. Select campaign and report type
4. Fill in utilization details and expenses
5. Add achievements, challenges, next steps
6. Choose to publish immediately or save as draft
7. Published reports become publicly visible for transparency

### For Donors/Public:
1. Visit any campaign page
2. Click "View Transparency Reports"
3. Browse published reports to see how funds are being used
4. View detailed expense breakdowns and impact metrics
5. See achievements and challenges faced by the NGO

## Benefits

- **Transparency**: Donors can see exactly how their contributions are being used
- **Trust Building**: Detailed reporting builds confidence in NGO operations  
- **Impact Tracking**: Clear metrics on beneficiaries and outcomes
- **Accountability**: Public reporting encourages responsible fund management
- **Donor Retention**: Transparency leads to increased donor satisfaction and repeat donations

## File Structure

```
src/app/
├── api/
│   ├── campaigns/[id]/reports/route.js          # Public reports API
│   └── ngo/campaigns/reports/
│       ├── route.js                             # NGO reports CRUD
│       └── [id]/route.js                        # Individual report management
├── campaigns/[id]/reports/page.js               # Public transparency page
└── ngo/campaigns/reports/
    ├── page.js                                  # Reports management dashboard
    └── create/page.js                           # Report creation form
```

This feature significantly enhances the platform's transparency and trust-building capabilities, providing donors with clear visibility into how their contributions are making an impact.