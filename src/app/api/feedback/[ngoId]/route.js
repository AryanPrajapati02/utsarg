import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request, { params }) {
  try {
    const { ngoId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const category = searchParams.get('category');
    const rating = searchParams.get('rating');

    if (!ngoId) {
      return NextResponse.json({ error: 'NGO ID is required' }, { status: 400 });
    }

    // Get rating summary
    const { data: ratingSummary, error: summaryError } = await supabase
      .from('ngo_rating_summary')
      .select('*')
      .eq('ngo_id', ngoId)
      .single();

    if (summaryError && summaryError.code !== 'PGRST116') {
      console.error('Error fetching rating summary:', summaryError);
    }

    // Build feedback query
    let feedbackQuery = supabase
      .from('ngo_feedback')
      .select(`
        *,
        users!ngo_feedback_user_id_fkey(
          id,
          email,
          donor_profiles(full_name),
          volunteer_profiles(full_name)
        )
      `)
      .eq('ngo_id', ngoId)
      .eq('is_verified', true);

    // Apply filters
    if (category && category !== 'all') {
      feedbackQuery = feedbackQuery.eq('category', category);
    }
    if (rating && rating !== 'all') {
      feedbackQuery = feedbackQuery.eq('rating', parseInt(rating));
    }

    // Get total count for pagination
    const { count: totalCount } = await feedbackQuery.select('*', { count: 'exact', head: true });

    // Get paginated feedback
    const { data: feedback, error: feedbackError } = await feedbackQuery
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (feedbackError) {
      console.error('Error fetching feedback:', feedbackError);
      return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
    }

    // Format feedback data
    const formattedFeedback = feedback.map(item => ({
      id: item.id,
      rating: item.rating,
      feedback_text: item.feedback_text,
      category: item.category,
      user_type: item.user_type,
      is_anonymous: item.is_anonymous,
      created_at: item.created_at,
      user_name: item.is_anonymous ? 'Anonymous' : (
        item.users?.donor_profiles?.full_name || 
        item.users?.volunteer_profiles?.full_name || 
        'User'
      )
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      feedback: formattedFeedback,
      ratingSummary: ratingSummary || {
        total_ratings: 0,
        average_rating: 0,
        rating_1_count: 0,
        rating_2_count: 0,
        rating_3_count: 0,
        rating_4_count: 0,
        rating_5_count: 0,
        donor_ratings: 0,
        volunteer_ratings: 0,
        general_ratings: 0
      },
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit
      }
    });

  } catch (error) {
    console.error('Get feedback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}