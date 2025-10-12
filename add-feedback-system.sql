-- Add feedback and rating system tables

-- NGO Feedback table
CREATE TABLE IF NOT EXISTS ngo_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ngo_id UUID REFERENCES ngo_profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('donor', 'volunteer', 'general')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('general', 'transparency', 'communication', 'impact', 'efficiency')),
  is_anonymous BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(ngo_id, user_id) -- One feedback per user per NGO
);

-- NGO Rating Summary table (for performance)
CREATE TABLE IF NOT EXISTS ngo_rating_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ngo_id UUID REFERENCES ngo_profiles(id) ON DELETE CASCADE UNIQUE,
  total_ratings INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  rating_1_count INTEGER DEFAULT 0,
  rating_2_count INTEGER DEFAULT 0,
  rating_3_count INTEGER DEFAULT 0,
  rating_4_count INTEGER DEFAULT 0,
  rating_5_count INTEGER DEFAULT 0,
  donor_ratings INTEGER DEFAULT 0,
  volunteer_ratings INTEGER DEFAULT 0,
  general_ratings INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Feedback Reports table (for moderation)
CREATE TABLE IF NOT EXISTS feedback_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_id UUID REFERENCES ngo_feedback(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ngo_feedback_ngo_id ON ngo_feedback(ngo_id);
CREATE INDEX IF NOT EXISTS idx_ngo_feedback_user_id ON ngo_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ngo_feedback_rating ON ngo_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_ngo_feedback_created_at ON ngo_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_ngo_rating_summary_average ON ngo_rating_summary(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_reports_status ON feedback_reports(status);

-- Enable RLS
ALTER TABLE ngo_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ngo_rating_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all feedback" ON ngo_feedback FOR SELECT USING (true);
CREATE POLICY "Users can insert their own feedback" ON ngo_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own feedback" ON ngo_feedback FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view rating summaries" ON ngo_rating_summary FOR SELECT USING (true);
CREATE POLICY "Only system can modify rating summaries" ON ngo_rating_summary FOR ALL USING (false);

-- Function to update rating summary when feedback is added/updated/deleted
CREATE OR REPLACE FUNCTION update_ngo_rating_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT and UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    INSERT INTO ngo_rating_summary (ngo_id, total_ratings, average_rating, rating_1_count, rating_2_count, rating_3_count, rating_4_count, rating_5_count, donor_ratings, volunteer_ratings, general_ratings, last_updated)
    SELECT 
      NEW.ngo_id,
      COUNT(*) as total_ratings,
      ROUND(AVG(rating::numeric), 2) as average_rating,
      COUNT(*) FILTER (WHERE rating = 1) as rating_1_count,
      COUNT(*) FILTER (WHERE rating = 2) as rating_2_count,
      COUNT(*) FILTER (WHERE rating = 3) as rating_3_count,
      COUNT(*) FILTER (WHERE rating = 4) as rating_4_count,
      COUNT(*) FILTER (WHERE rating = 5) as rating_5_count,
      COUNT(*) FILTER (WHERE user_type = 'donor') as donor_ratings,
      COUNT(*) FILTER (WHERE user_type = 'volunteer') as volunteer_ratings,
      COUNT(*) FILTER (WHERE user_type = 'general') as general_ratings,
      NOW()
    FROM ngo_feedback 
    WHERE ngo_id = NEW.ngo_id
    ON CONFLICT (ngo_id) 
    DO UPDATE SET
      total_ratings = EXCLUDED.total_ratings,
      average_rating = EXCLUDED.average_rating,
      rating_1_count = EXCLUDED.rating_1_count,
      rating_2_count = EXCLUDED.rating_2_count,
      rating_3_count = EXCLUDED.rating_3_count,
      rating_4_count = EXCLUDED.rating_4_count,
      rating_5_count = EXCLUDED.rating_5_count,
      donor_ratings = EXCLUDED.donor_ratings,
      volunteer_ratings = EXCLUDED.volunteer_ratings,
      general_ratings = EXCLUDED.general_ratings,
      last_updated = EXCLUDED.last_updated;
    
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    INSERT INTO ngo_rating_summary (ngo_id, total_ratings, average_rating, rating_1_count, rating_2_count, rating_3_count, rating_4_count, rating_5_count, donor_ratings, volunteer_ratings, general_ratings, last_updated)
    SELECT 
      OLD.ngo_id,
      COUNT(*) as total_ratings,
      COALESCE(ROUND(AVG(rating::numeric), 2), 0) as average_rating,
      COUNT(*) FILTER (WHERE rating = 1) as rating_1_count,
      COUNT(*) FILTER (WHERE rating = 2) as rating_2_count,
      COUNT(*) FILTER (WHERE rating = 3) as rating_3_count,
      COUNT(*) FILTER (WHERE rating = 4) as rating_4_count,
      COUNT(*) FILTER (WHERE rating = 5) as rating_5_count,
      COUNT(*) FILTER (WHERE user_type = 'donor') as donor_ratings,
      COUNT(*) FILTER (WHERE user_type = 'volunteer') as volunteer_ratings,
      COUNT(*) FILTER (WHERE user_type = 'general') as general_ratings,
      NOW()
    FROM ngo_feedback 
    WHERE ngo_id = OLD.ngo_id
    ON CONFLICT (ngo_id) 
    DO UPDATE SET
      total_ratings = EXCLUDED.total_ratings,
      average_rating = EXCLUDED.average_rating,
      rating_1_count = EXCLUDED.rating_1_count,
      rating_2_count = EXCLUDED.rating_2_count,
      rating_3_count = EXCLUDED.rating_3_count,
      rating_4_count = EXCLUDED.rating_4_count,
      rating_5_count = EXCLUDED.rating_5_count,
      donor_ratings = EXCLUDED.donor_ratings,
      volunteer_ratings = EXCLUDED.volunteer_ratings,
      general_ratings = EXCLUDED.general_ratings,
      last_updated = EXCLUDED.last_updated;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_ngo_rating_summary
  AFTER INSERT OR UPDATE OR DELETE ON ngo_feedback
  FOR EACH ROW EXECUTE FUNCTION update_ngo_rating_summary();