import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ProfileEditForm } from './profile-edit-form';

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
                    <ProfileEditForm profile={profile} />
                </CardContent>
            </Card>
        </div>
    );
} 