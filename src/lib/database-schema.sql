-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('ngo', 'donor', 'volunteer', 'super_admin')),
  is_verified BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  otp VARCHAR(6),
  otp_expires_at TIMESTAMP,
  reset_token VARCHAR(255),
  reset_token_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- NGO profiles
CREATE TABLE IF NOT EXISTS ngo_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ngo_name VARCHAR(255) NOT NULL,
  darpan_id VARCHAR(50) UNIQUE NOT NULL,
  npo_type VARCHAR(100) NOT NULL,
  registered_state VARCHAR(100) NOT NULL,
  registered_district VARCHAR(100) NOT NULL,
  description TEXT,
  contact_person VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  website VARCHAR(255),
  logo_url VARCHAR(500),
  documents JSONB,
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  verification_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Donor profiles
CREATE TABLE IF NOT EXISTS donor_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  blood_group VARCHAR(5),
  preferred_causes JSONB,
  total_donated DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Volunteer profiles
CREATE TABLE IF NOT EXISTS volunteer_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  skills JSONB,
  availability JSONB,
  experience TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ngo_id UUID REFERENCES ngo_profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  campaign_type VARCHAR(20) NOT NULL CHECK (campaign_type IN ('money', 'clothes', 'food', 'blood', 'volunteer')),
  target_amount DECIMAL(12,2),
  raised_amount DECIMAL(12,2) DEFAULT 0,
  target_items INTEGER,
  collected_items INTEGER DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location VARCHAR(255),
  images JSONB,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Donations
CREATE TABLE IF NOT EXISTS donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_id UUID REFERENCES donor_profiles(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  donation_type VARCHAR(20) DEFAULT 'money' CHECK (donation_type IN ('money', 'clothes', 'food', 'blood')),
  amount DECIMAL(12,2),
  quantity INTEGER,
  donor_name VARCHAR(255),
  donor_email VARCHAR(255),
  donor_phone VARCHAR(20),
  is_anonymous BOOLEAN DEFAULT FALSE,
  transaction_id VARCHAR(255),
  description TEXT,
  razorpay_payment_id VARCHAR(255),
  razorpay_order_id VARCHAR(255),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  payment_date TIMESTAMP,
  donation_date TIMESTAMP DEFAULT NOW(),
  delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'collected', 'delivered')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Volunteer registrations
CREATE TABLE IF NOT EXISTS volunteer_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  volunteer_id UUID REFERENCES volunteer_profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'applied' CHECK (status IN ('applied', 'accepted', 'rejected', 'completed')),
  message TEXT,
  hours_contributed INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Volunteer applications (for applying to NGOs directly)
CREATE TABLE IF NOT EXISTS volunteer_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  volunteer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ngo_id UUID REFERENCES ngo_profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(volunteer_id, ngo_id)
);

-- Campaign updates
CREATE TABLE IF NOT EXISTS campaign_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  images JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Campaign reports for transparency
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

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_ngo_profiles_user_id ON ngo_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_ngo_profiles_verification_status ON ngo_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_campaigns_ngo_id ON campaigns(ngo_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_campaign_id ON donations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_registrations_volunteer_id ON volunteer_registrations(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_registrations_campaign_id ON volunteer_registrations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_reports_campaign_id ON campaign_reports(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_reports_published ON campaign_reports(is_published);

-- Function to increment campaign raised amount
CREATE OR REPLACE FUNCTION increment_campaign_amount(campaign_id UUID, amount_to_add DECIMAL)
RETURNS void AS $$
BEGIN
  UPDATE campaigns 
  SET raised_amount = raised_amount + amount_to_add,
      updated_at = NOW()
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ngo_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;