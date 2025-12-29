import { EventImageRequest } from '../types';
import { Logger } from './logger';

interface ValidationResult {
    isValid: boolean;
    data?: {
        event_id: number;
        fixture_id: number;
        event_type: string;
    };
    error?: {
        status: number;
        message: string;
        error: string;
    };
}

export const validateGenerateImageRequest = (body: any): ValidationResult => {
    let { event_id, event_type, fixture_id } = body;

    // Ensure IDs are numbers
    const parsedEventId = Number(event_id);
    const parsedFixtureId = Number(fixture_id);

    // Validate request data
    if (!event_type) {
        return {
            isValid: false,
            error: {
                status: 400,
                error: 'Bad Request',
                message: 'event_type is required',
            }
        };
    }

    // Logic: Only proceed if event_type is 'GOAL' or 'OWN_GOAL'
    // Using case-insensitive check for reliability
    const normalizedEventType = event_type.toLowerCase();
    if (normalizedEventType !== 'goal' && normalizedEventType !== 'owngoal') {
        Logger.info('Event type is not GOAL or OWN GOAL, skipping image generation', { event_type });
        return {
            isValid: false,
            error: {
                status: 400,
                error: 'Bad Request',
                message: 'Process skipped: only GOAL or OWN GOAL events trigger image generation',
            }
        };
    }

    return {
        isValid: true,
        data: {
            event_id: parsedEventId,
            fixture_id: parsedFixtureId,
            event_type: event_type
        }
    };
};
