import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const API_SPORTS_KEY = Deno.env.get('API_SPORTS_KEY') ?? '';
const API_SPORTS_HOST = 'v3.football.api-sports.io';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting sports data sync...');

    // Fetch live football matches
    const footballResponse = await fetch(
      `https://${API_SPORTS_HOST}/fixtures?live=all`,
      {
        headers: {
          'x-rapidapi-host': API_SPORTS_HOST,
          'x-rapidapi-key': API_SPORTS_KEY,
        },
      }
    );

    if (!footballResponse.ok) {
      throw new Error(`API-Sports: Failed to fetch football data - ${footballResponse.status}`);
    }

    const footballData = await footballResponse.json();
    console.log(`Fetched ${footballData.response?.length || 0} live football matches`);

    // Process and store football matches
    if (footballData.response && footballData.response.length > 0) {
      for (const fixture of footballData.response.slice(0, 20)) { // Limit to 20 matches
        const match = fixture.fixture;
        const league = fixture.league;
        const teams = fixture.teams;
        const goals = fixture.goals;

        // Upsert league
        await supabaseAdmin.from('leagues').upsert({
          id: `league-${league.id}`,
          name: league.name,
          sport: 'Football',
          country: league.country,
          logo: league.logo,
        }, { onConflict: 'id' });

        // Upsert teams
        await supabaseAdmin.from('teams').upsert([
          {
            id: `team-${teams.home.id}`,
            name: teams.home.name,
            sport: 'Football',
            logo: teams.home.logo,
            country: league.country,
          },
          {
            id: `team-${teams.away.id}`,
            name: teams.away.name,
            sport: 'Football',
            logo: teams.away.logo,
            country: league.country,
          },
        ], { onConflict: 'id' });

        // Determine status
        let status = 'upcoming';
        if (match.status.short === 'FT' || match.status.short === 'AET' || match.status.short === 'PEN') {
          status = 'finished';
        } else if (match.status.short !== 'NS' && match.status.short !== 'TBD') {
          status = 'live';
        }

        // Upsert match
        await supabaseAdmin.from('matches').upsert({
          id: `match-${match.id}`,
          sport: 'Football',
          league_id: `league-${league.id}`,
          league_name: league.name,
          home_team_id: `team-${teams.home.id}`,
          home_team_name: teams.home.name,
          home_team_logo: teams.home.logo,
          home_team_score: goals.home,
          away_team_id: `team-${teams.away.id}`,
          away_team_name: teams.away.name,
          away_team_logo: teams.away.logo,
          away_team_score: goals.away,
          status: status,
          match_time: match.status.elapsed ? `${match.status.elapsed}'` : new Date(match.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          match_minute: match.status.elapsed ? `${match.status.elapsed}'` : null,
          match_date: match.date,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      }
    }

    // Fetch upcoming matches (today)
    const today = new Date().toISOString().split('T')[0];
    const upcomingResponse = await fetch(
      `https://${API_SPORTS_HOST}/fixtures?date=${today}`,
      {
        headers: {
          'x-rapidapi-host': API_SPORTS_HOST,
          'x-rapidapi-key': API_SPORTS_KEY,
        },
      }
    );

    if (upcomingResponse.ok) {
      const upcomingData = await upcomingResponse.json();
      console.log(`Fetched ${upcomingData.response?.length || 0} upcoming matches`);

      if (upcomingData.response && upcomingData.response.length > 0) {
        for (const fixture of upcomingData.response.slice(0, 10)) {
          const match = fixture.fixture;
          const league = fixture.league;
          const teams = fixture.teams;

          // Skip if already processed as live
          const status = match.status.short === 'NS' || match.status.short === 'TBD' ? 'upcoming' : 'live';
          if (status === 'live') continue;

          await supabaseAdmin.from('leagues').upsert({
            id: `league-${league.id}`,
            name: league.name,
            sport: 'Football',
            country: league.country,
            logo: league.logo,
          }, { onConflict: 'id' });

          await supabaseAdmin.from('teams').upsert([
            {
              id: `team-${teams.home.id}`,
              name: teams.home.name,
              sport: 'Football',
              logo: teams.home.logo,
              country: league.country,
            },
            {
              id: `team-${teams.away.id}`,
              name: teams.away.name,
              sport: 'Football',
              logo: teams.away.logo,
              country: league.country,
            },
          ], { onConflict: 'id' });

          await supabaseAdmin.from('matches').upsert({
            id: `match-${match.id}`,
            sport: 'Football',
            league_id: `league-${league.id}`,
            league_name: league.name,
            home_team_id: `team-${teams.home.id}`,
            home_team_name: teams.home.name,
            home_team_logo: teams.home.logo,
            home_team_score: null,
            away_team_id: `team-${teams.away.id}`,
            away_team_name: teams.away.name,
            away_team_logo: teams.away.logo,
            away_team_score: null,
            status: 'upcoming',
            match_time: new Date(match.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            match_minute: null,
            match_date: match.date,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });
        }
      }
    }

    console.log('Sports data sync completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Sports data synced successfully',
        stats: {
          liveMatches: footballData.response?.length || 0,
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error syncing sports data:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
