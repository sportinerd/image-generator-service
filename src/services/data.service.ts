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

        // 1. Fetch Fixture
        const fixture = await getFixture(db, fixtureId);

        // 2. Fetch Related Entities (Teams, League, Gameweek)
        const { homeTeam, awayTeam, league, gameweek } = await getRelatedEntities(db, fixture);

        // 3. Find specific event
        const eventData = await findEventInFixture(db, fixture, eventId);

        // 4. Determine Scoring Team
        const playerTeamName = await getPlayerTeam(db, fixture, eventData);

        Logger.info('Event data fetched successfully', { eventId });

        // 5. Construct Response
        return mapToImageRequest(eventId, eventType, fixture, eventData, homeTeam, awayTeam, league, gameweek, playerTeamName);
    }
};

// --- Helper Functions ---

async function getFixture(db: any, fixtureId: number) {
    const fixture = await db.collection('fixtures').findOne({ api_fixture_id: fixtureId });
    if (!fixture) {
        Logger.warn('Fixture not found', { fixtureId });
        throw new Error(`Fixture with api_fixture_id ${fixtureId} not found`);
    }
    return fixture;
}

async function getRelatedEntities(db: any, fixture: any) {
    const homeTeam = await db.collection('teams').findOne({ _id: fixture.home_team_id });
    const awayTeam = await db.collection('teams').findOne({ _id: fixture.away_team_id });
    const league = await db.collection('leagues').findOne({ _id: fixture.league_id });
    const gameweek = await db.collection('gameweeks').findOne({ _id: fixture.gameweek_id });
    return { homeTeam, awayTeam, league, gameweek };
}

async function findEventInFixture(db: any, fixture: any, eventId: number) {
    const fixtureEventDoc = await db.collection('fixtureevents').findOne({
        fixture_id: fixture._id,
        "events.id": eventId
    });

    if (!fixtureEventDoc) {
        Logger.warn('Event not found in FixtureEvents', { fixtureId: fixture.api_fixture_id, fixtureObjectId: fixture._id, eventId });
        throw new Error(`Event with id ${eventId} not found for fixture ${fixture.api_fixture_id}`);
    }

    const eventData = fixtureEventDoc.events.find((e: any) => e.id === eventId);
    if (!eventData) {
        throw new Error('Event data could not be extracted from document');
    }

    // Validate Event Type
    const eventTypeId = eventData.type_id;
    if (eventTypeId !== 14 && eventTypeId !== 15) {
        // throw new Error('Event type might not be GOAL or OWN_GOAL');
    }

    return eventData;
}

async function getPlayerTeam(db: any, fixture: any, eventData: any): Promise<string> {
    if (!eventData.player_id) return 'Team';

    try {
        const player = await db.collection('players').findOne({ api_player_id: eventData.player_id });
        if (!player) {
            Logger.warn('Player not found for event', { api_player_id: eventData.player_id });
            return 'Team';
        }

        const fixturePlayerStats = await db.collection('fixtureplayerstats').findOne({
            fixture_id: fixture._id,
            player_id: player._id
        });

        if (fixturePlayerStats && fixturePlayerStats.team_id) {
            const team = await db.collection('teams').findOne({ _id: fixturePlayerStats.team_id });
            if (team) return team.name;
        }
    } catch (err) {
        Logger.error('Error fetching scoring team details', { error: err });
    }
    return 'Team';
}

function mapToImageRequest(
    eventId: number,
    eventType: string,
    fixture: any,
    eventData: any,
    homeTeam: any,
    awayTeam: any,
    league: any,
    gameweek: any,
    playerTeamName: string
): ImageRequest {
    return {
        id: eventId,
        type: eventType.toLowerCase(),
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
            club_logo: league?.image_path || league?.image || '',
            goals: eventData.goals || 1,
            scorers: eventData.scorers || []
        }
    };
}
