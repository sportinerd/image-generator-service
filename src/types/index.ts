export interface TeamData {
    name: string;
    logo: string;
    short_name: string;
}

export interface Scorer {
    name: string;
    minute: number;
    type: string;
}

export interface GoalData {
    home_team: TeamData;
    away_team: TeamData;
    team_win: string;
    club_name: string;
    club_logo: string;
    goals: number;
    scorers: Scorer[];
}

export interface ImageRequest {
    id: number;
    type: string;
    title: string;
    gw: string;
    data: GoalData;
}

export interface GenerateImageResponse {
    success: boolean;
    imageUrl: string;
    imageKey: string;
    message?: string;
}

export interface DeleteImageResponse {
    success: boolean;
    message: string;
}

export interface ErrorResponse {
    success: false;
    error: string;
    message: string;
}
