import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { ngoId, rating, feedbackText, category, isAnonymous, userType } = await request.json();

    // Validate input
    if (!ngoId || !rating || !feedbackText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    if (feedbackText.trim().length < 10) {
      return NextResponse.json({ error: 'Feedback must be at least 10 characters' }, { status: 400 });
    }

    // Check if NGO exists
    const { data: ngo, error: ngoError } = await supabase
      .from('ngo_profiles')
      .select('id, ngo_name')
      .eq('id', ngoId)
      .single();

    if (ngoError || !ngo) {
      return NextResponse.json({ error: 'NGO not found' }, { status: 404 });
    }

    // Check if user already submitted feedback for this NGO
    const { data: existingFeedback, error: checkError } = await supabase
      .from('ngo_feedback')
      .select('id')
      .eq('ngo_id', ngoId)
      .eq('user_id', decoded.userId)
      .single();

    if (existingFeedback) {
      // Update existing feedback
      const { data: updatedFeedback, error: updateError } = await supabase
        .from('ngo_feedback')
        .update({
          rating,
          feedback_text: feedbackText.trim(),
          category: category || 'general',
          is_anonymous: isAnonymous || false,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingFeedback.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating feedback:', updateError);
        return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Feedback updated successfully',
        feedback: updatedFeedback,
        isUpdate: true
      });
    } else {
      // Create new feedback
      const { data: newFeedback, error: insertError } = await supabase
        .from('ngo_feedback')
        .insert({
          ngo_id: ngoId,
          user_id: decoded.userId,
          user_type: userType || decoded.userType || 'general',
          rating,
          feedback_text: feedbackText.trim(),
          category: category || 'general',
          is_anonymous: isAnonymous || false
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating feedback:', insertError);
        return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Feedback submitted successfully',
        feedback: newFeedback,
        isUpdate: false
      });
    }

  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}