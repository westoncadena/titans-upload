export interface Profile {
    id: string;
    name: string;
    greeting: string | null;
    bio: string | null;
    image_url: string | null;
    created_at: string;
    updated_at: string | null;
}

export interface ProfileFormData {
    name: string;
    greeting: string;
    image?: File;
}