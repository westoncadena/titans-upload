export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    name: string
                    email: string | null
                    bio: string | null
                    image_url: string | null
                    created_at: string
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    name: string
                    email?: string | null
                    bio?: string | null
                    image_url?: string | null
                    created_at?: string
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    name?: string
                    email?: string | null
                    bio?: string | null
                    image_url?: string | null
                    created_at?: string
                    updated_at?: string | null
                }
            }
            // Add other tables here as needed
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
} 