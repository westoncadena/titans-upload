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

        const name = formData.get('name') as string;
        const greeting = formData.get('greeting') as string;
        const bio = formData.get('bio') as string;
        const image_url = formData.get('image_url') as string;

        if (!name) {
            return { error: 'Name is required' };
        }

        const supabase = await createServerClient();

        const { error } = await supabase
            .from('profiles')
            .update({
                name,
                greeting,
                bio,
                image_url,
                updated_at: new Date().toISOString(),
            } as any)
            .eq('id', resolvedParams.id as any);

        if (error) {
            return { error: error.message };
        }

        redirect(`/profiles/${resolvedParams.id}`);
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