import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 20;
    const category = searchParams.get('category') || 'all';
    const minRatings = parseInt(searchParams.get('minRatings')) || 5;

    // Base query for NGO leaderboard
    let query = supabase
      .from('ngo_rating_summary')
      .select(`
        *,
        ngo_profiles!ngo_rating_summary_ngo_id_fkey(
          id,
          ngo_name,
          description,
          registered_district,
          registered_state,
          phone,
          website,
          npo_type,
          darpan_id
        )
      `)
      .gte('total_ratings', minRatings)
      .order('average_rating', { ascending: false })
      .order('total_ratings', { ascending: false })
      .limit(limit);

    const { data: leaderboardData, error } = await query;

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }

    // Format leaderboard data
    const formattedLeaderboard = leaderboardData.map((item, index) => ({
      rank: index + 1,
      ngo_id: item.ngo_id,
      ngo_name: item.ngo_profiles?.ngo_name,
      description: item.ngo_profiles?.description,
      location: `${item.ngo_profiles?.registered_district}, ${item.ngo_profiles?.registered_state}`,
      npo_type: item.ngo_profiles?.npo_type,
      darpan_id: item.ngo_profiles?.darpan_id,
      website: item.ngo_profiles?.website,
      average_rating: parseFloat(item.average_rating),
      total_ratings: item.total_ratings,
      rating_distribution: {
        rating_5: item.rating_5_count,
        rating_4: item.rating_4_count,
        rating_3: item.rating_3_count,
        rating_2: item.rating_2_count,
        rating_1: item.rating_1_count
      },
      user_type_breakdown: {
        donor_ratings: item.donor_ratings,
        volunteer_ratings: item.volunteer_ratings,
        general_ratings: item.general_ratings
      },
      last_updated: item.last_updated
    }));

    // Get additional statistics
    const { data: totalNGOs } = await supabase
      .from('ngo_profiles')
      .select('id', { count: 'exact', head: true });

    const { data: ratedNGOs } = await supabase
      .from('ngo_rating_summary')
      .select('id', { count: 'exact', head: true })
      .gte('total_ratings', 1);

    const stats = {
      total_ngos: totalNGOs || 0,
      rated_ngos: ratedNGOs || 0,
      qualified_ngos: leaderboardData.length,
      min_ratings_required: minRatings
    };

    return NextResponse.json({
      leaderboard: formattedLeaderboard,
      stats,
      filters: {
        limit,
        category,
        minRatings
      }
    });

  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}