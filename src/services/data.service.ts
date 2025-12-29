import { ImageRequest } from '../types';
import { getDb } from '../config/database';
import { Logger } from '../utils/logger';

/**
 * Service to handle data fetching and transformation for image generation
 */
export const dataService = {
    /**
     * Fetches image data based on event and fixture IDs
     */
    async fetchImageData(params: { eventId: number; eventType: string; fixtureId: number }): Promise<ImageRequest> {
        const { eventId, eventType, fixtureId } = params;
        const db = getDb();

        // 1. Find Fixture by api_fixture_id
        const fixture = await db.collection('fixtures').findOne({ api_fixture_id: fixtureId });

        if (!fixture) {
            Logger.warn('Fixture not found', { fixtureId });
            throw new Error(`Fixture with api_fixture_id ${fixtureId} not found`);
        }

        // 2. Manual "populate" for related entities
        // We assume collections are named 'teams', 'leagues', 'gameweeks' based on common conventions

        const homeTeam = await db.collection('teams').findOne({ _id: fixture.home_team_id });
        const awayTeam = await db.collection('teams').findOne({ _id: fixture.away_team_id });
        const league = await db.collection('leagues').findOne({ _id: fixture.league_id });
        const gameweek = await db.collection('gameweeks').findOne({ _id: fixture.gameweek_id });


        // 3. Find FixtureEvent using fixture._id and eventId inside the array
        const fixtureEventDoc = await db.collection('fixtureevents').findOne({
            fixture_id: fixture._id,
            "events.id": eventId
        });

        if (!fixtureEventDoc) {
            Logger.warn('Event not found in FixtureEvents', { fixtureId, fixtureObjectId: fixture._id, eventId });
            throw new Error(`Event with id ${eventId} not found for fixture ${fixtureId}`);
        }

        // 4. Extract the specific event from the array
        const eventData = fixtureEventDoc.events.find((e: any) => e.id === eventId);

        if (!eventData) {
            throw new Error('Event data could not be extracted from document');
        }
        // 5. Determine the team that scored by linking event -> player -> fixture_player_stats -> team
        let playerTeamName = 'Team';

        if (eventData.player_id) {
            try {
                const player = await db.collection('players').findOne({ api_player_id: eventData.player_id });

                if (player) {
                    const fixturePlayerStats = await db.collection('fixtureplayerstats').findOne({
                        fixture_id: fixture._id,
                        player_id: player._id
                    });

                    if (fixturePlayerStats && fixturePlayerStats.team_id) {
                        const team = await db.collection('teams').findOne({ _id: fixturePlayerStats.team_id });
                        if (team) {
                            playerTeamName = team.name;
                        }
                    }
                } else {
                    Logger.warn('Player not found for event', { api_player_id: eventData.player_id });
                }
            } catch (err) {
                Logger.error('Error fetching scoring team details', { error: err });
            }
        }


        const eventTypeId = eventData.type_id;

        // Optional: Check event type ID? User didn't strictly enforce in this prompt but it was there before.
        // Keeping it safe
        if (eventTypeId !== 14 && eventTypeId !== 15) {
            // Logger.warn('Event type might not be GOAL', { eventTypeId });
            throw new Error('Event type might not be GOAL or OWN_GOAL');
        }

        Logger.info('Event data fetched successfully', { eventId });

        // Map the DB data to the ImageRequest structure
        return {
            id: eventId,
            type: eventType.toLowerCase(), // 'goal'
            title: eventData.title || 'GOAL!',
            gw: gameweek?.code || 'N/A',
            data: {
                home_team: {
                    name: homeTeam?.name || 'Home Team',
                    logo: homeTeam?.image_path || '',
                    short_name: homeTeam?.short_code || 'HOM'
                },
                away_team: {
                    name: awayTeam?.name || 'Away Team',
                    logo: awayTeam?.image_path || '',
                    short_name: awayTeam?.short_code || 'AWY'
                },
                goal_scored_team: playerTeamName,
                club_name: league?.name || 'League',
                club_logo: league?.image_path || league?.image || '', // Check valid field
                goals: eventData.goals || 1,
                scorers: eventData.scorers || []
            }
        };
    }
};
