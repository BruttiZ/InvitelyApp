export type PublicEvent = {
    id: string;
    source?: 'laravel' | 'go' | 'demo';
    name: string;
    slug: string;
    status: string;
    starts_at: string;
    ends_at: string | null;
    timezone: string;
    venue: {
        name: string | null;
        address: string | null;
        latitude: string | null;
        longitude: string | null;
    };
    spotify_playlist_url: string | null;
    hero: {
        eyebrow?: string;
        title?: string;
        subtitle?: string;
        image_url?: string;
    };
    content: {
        hosts?: string[];
        schedule?: { time: string; title: string }[];
        dress_code?: string;
        note?: string;
    };
    theme: {
        mode?: 'dark' | 'light';
        primary?: string;
        accent?: string;
    };
    gallery: { url: string; alt: string }[];
    metrics?: {
        accepted: number;
        declined: number;
        invited: number;
    };
};
