-- Add campaign reports table for transparency
CREATE TABLE IF NOT EXISTS campaign_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  report_type VARCHAR(20) DEFAULT 'utilization' CHECK (report_type IN ('utilization', 'progress', 'completion')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  amount_utilized DECIMAL(12,2),
  items_utilized INTEGER,
  expenses JSONB, -- Array of expense objects with category, amount, description, bills
  achievements TEXT,
  challenges TEXT,
  next_steps TEXT,
  images JSONB, -- Array of image URLs
  documents JSONB, -- Array of document URLs (receipts, certificates, etc.)
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

-- Beneficiaries table for tracking people helped by campaigns
CREATE TABLE IF NOT EXISTS beneficiaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  report_id UUID REFERENCES campaign_reports(id) ON DELETE SET NULL,
  name VARCHAR(255),
  age INTEGER,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
  location VARCHAR(255),
  contact_info JSONB, -- phone, email, address
  assistance_type VARCHAR(100), -- what help they received
  assistance_details TEXT,
  assistance_date DATE,
  amount_received DECIMAL(10,2),
  items_received INTEGER,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'inactive')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for beneficiaries
CREATE INDEX IF NOT EXISTS idx_beneficiaries_campaign_id ON beneficiaries(campaign_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_report_id ON beneficiaries(report_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_status ON beneficiaries(status);

-- Enable Row Level Security for beneficiaries
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;