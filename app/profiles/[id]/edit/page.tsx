import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ProfileEditForm from './profile-edit-form';
import { Profile } from '@/types/profile';

export default async function ProfileEditPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const supabase = await createServerClient();

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', resolvedParams.id as any)
        .single();

    if (error || !profile) {
        notFound();
    }

    // Type assertion with proper error handling
    const typedProfile = profile as unknown as Profile;

    async function updateProfile(formData: FormData) {
        'use server';

        try {
            const name = formData.get('name') as string;
            const greeting = formData.get('greeting') as string;
            const bio = formData.get('bio') as string;
            const image_url = formData.get('image_url') as string;
            const face_encoding = formData.get('face_encoding') as string;

            if (!name) {
                return { error: 'Name is required' };
            }

            const supabase = await createServerClient();

            // Prepare update data
            const updateData: any = {
                name,
                greeting,
                bio,
                image_url,
                face_encoding,
                updated_at: new Date().toISOString(),
            };


            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', resolvedParams.id);

            if (error) {
                console.error('Supabase update error:', error);
                return { error: error.message };
            }

            return { success: true };
        } catch (err) {
            console.error('Server action error:', err);
            return { error: 'An unexpected error occurred' };
        }
    }

    return (
        <div className="container max-w-3xl py-10">
            <Button variant="ghost" size="sm" asChild className="mb-6">
                <Link href={`/profiles/${resolvedParams.id}`} className="flex items-center">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to profile
                </Link>
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Edit Profile</CardTitle>
                </CardHeader>

                <CardContent>
                    <ProfileEditForm
                        profile={typedProfile}
                        updateProfile={updateProfile}
                    />
                </CardContent>
            </Card>
        </div>
    );
} 