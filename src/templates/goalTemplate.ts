import { ImageRequest } from '../types';

/**
 * Generates the HTML content for the goal image based on the provided data.
 * Mimics the structure and styling of the GoalContent React component.
 */
export const getGoalHtmlTemplate = (data: ImageRequest): string => {
    // Extract data with fallbacks
    const goalScoredTeam = data.data.goal_scored_team || '';
    const homeTeam = data.data.home_team;
    const awayTeam = data.data.away_team;

    // Determine the main winning team logo
    let mainLogoSrc = '';
    if (goalScoredTeam && homeTeam?.name === goalScoredTeam && homeTeam.logo) {
        mainLogoSrc = homeTeam.logo;
    } else if (goalScoredTeam && awayTeam?.name === goalScoredTeam && awayTeam.logo) {
        mainLogoSrc = awayTeam.logo;
    } else if (goalScoredTeam === homeTeam?.name) {
        mainLogoSrc = homeTeam?.logo || '';
    } else {
        mainLogoSrc = awayTeam?.logo || '';
    }

    // Determine bottom logos
    const homeLogoSrc = homeTeam?.logo || '';
    const awayLogoSrc = awayTeam?.logo || '';
    const clubLogoSrc = data.data.club_logo || '';

    // HTML Template string with Tailwind CSS
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Goal Image</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Anton&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        'anton': ['Anton', 'sans-serif'],
                    },
                    colors: {
                        'sky': {
                            500: '#0ea5e9',
                        }
                    }
                }
            }
        }
    </script>
    <style>
        /* Custom styles for text strokes and shadows that might not be fully covered by Tailwind utilities */
        .text-stroke-3 {
            -webkit-text-stroke: 3px rgba(255, 255, 255, 1);
        }
        .text-shadow-custom {
            text-shadow: 4px 4px 8px rgba(0,0,0,0.8), 0 0 20px rgba(255,255,255,0.1);
        }
    </style>
</head>
<body> <!-- Set body size explicitly for Puppeteer -->

    <div class="relative flex size-[900px] flex-col items-center justify-center  rounded"
         style="background-image: url('https://e-commerce-test.sgp1.digitaloceanspaces.com/goal/1767024590969-goal-background-design.png'); background-size: 100% 100%;"> 
    
        
        <!-- Top left back arrow / Logo -->
        <!-- Top left back arrow / Logo -->
        <div class="absolute top-0 left-8 flex max-w-[200px] h-26 items-center justify-start mt-8">
             <img src="https://sportinerd.com/_next/static/media/logo_text_prod.7589e8ed.png" alt="" class="h-10 object-contain">
        </div>

        <!-- Main winning team logo -->
        <div class="mb-12 flex w-32 h-32 items-center justify-center rounded-full bg-white">
            ${mainLogoSrc ?
            `<img src="${mainLogoSrc}" alt="${goalScoredTeam}" class="w-28 h-28 object-contain">` :
            `<div class="flex w-24 h-24 items-center justify-center rounded-full bg-red-600">
                    <div class="flex w-20 h-20 items-center justify-center rounded-full bg-white">
                        <div class="relative flex w-16 h-16 items-center justify-center">
                            <!-- Fallback Logo Shapes -->
                            <div class="absolute w-8 h-8 rounded-full bg-yellow-400"></div>
                            <div class="absolute w-6 h-6 rounded-full bg-black"></div>
                        </div>
                    </div>
                 </div>`
        }
        </div>

        <!-- GOAL text with layered effect -->
        <div class="relative mb-16 text-center">
            <!-- Background outlined text -->
            <h1 class="absolute top-0 left-[48%] z-[1000] text-[180px] leading-none tracking-[0.2em] text-transparent font-anton transform -translate-x-1/2 -translate-y-2 text-stroke-3">
                GOAL
            </h1>
            <!-- Foreground solid text -->
            <h1 class="relative z-0 text-[180px] leading-none font-black tracking-[0.2em] text-[#01BF63] drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)] font-anton text-shadow-custom">
                GOAL
            </h1>
        </div>

        <!-- Bottom team logos -->
        <div class="flex items-center gap-8">
            <!-- Home Team Logo -->
            <div class="flex w-20 h-20 items-center justify-center rounded-full bg-white">
                ${homeLogoSrc ?
            `<img src="${homeLogoSrc}" alt="${homeTeam?.name}" class="w-16 h-16 object-contain">` :
            `<div class="flex w-16 h-16 items-center justify-center rounded-full bg-red-600"></div>`
        }
            </div>

            <!-- League Logo -->
            <div class="flex w-16 h-16 items-center justify-center rounded-full bg-white">
                ${clubLogoSrc ?
            `<img src="${clubLogoSrc}" alt="${data.data.club_name}" class="w-12 h-12 object-contain">` :
            `<div class="flex w-12 h-12 items-center justify-center rounded bg-purple-700 text-white font-bold text-xs">PL</div>`
        }
            </div>

            <!-- Away Team Logo -->
            <div class="flex w-20 h-20 items-center justify-center rounded-full bg-white">
                ${awayLogoSrc ?
            `<img src="${awayLogoSrc}" alt="${awayTeam?.name}" class="w-16 h-16 object-contain">` :
            `<div class="flex w-16 h-16 items-center justify-center rounded-full bg-gray-600">
                        <div class="flex w-12 h-12 items-center justify-center rounded-full bg-white">
                            <span class="text-xs font-bold text-gray-600">${(awayTeam?.name || 'AWAY').slice(0, 3).toUpperCase()}</span>
                        </div>
                     </div>`
        }
            </div>
        </div>

    </div>

</body>
</html>
    `;
};
