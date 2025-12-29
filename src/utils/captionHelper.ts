import { ImageRequest } from '../types';

/**
 * Generates a social media caption based on the image data.
 */
export const generateCaption = (data: ImageRequest): string => {
    const { title, gw, data: goalData } = data;
    const { goal_scored_team, home_team, away_team, scorers } = goalData;

    let caption = `${title || 'GOAL!'} ⚽\n\n`;

    if (scorers && scorers.length > 0) {
        const latestScorer = scorers[scorers.length - 1];
        caption += `${latestScorer.name} (${latestScorer.minute}') finds the net! 🔥\n`;
    } else {
        caption += `${goal_scored_team} scores! 🔥\n`;
    }

    caption += `\n${home_team.name} vs ${away_team.name}\n`;
    caption += `GW ${gw} • ${goalData.club_name || 'Premier League'}\n\n`;

    const teamHashtag = goal_scored_team.replace(/\s+/g, '');
    caption += `#${teamHashtag} #PremierLeague #Goal #Football`;

    return caption;
};
