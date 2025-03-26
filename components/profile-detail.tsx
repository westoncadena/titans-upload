'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/profile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface ProfileDetailProps {
    profileId: string;
}

export function ProfileDetail({ profileId }: ProfileDetailProps) {
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', profileId)
                    .single();

                if (error) throw error;
                setProfile(data);
            } catch (error) {
                console.error('Error fetching profile:', error);
                toast.error('Failed to load profile details.');
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, [profileId]);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this profile?')) return;

        setDeleting(true);
        try {
            // Delete profile image if exists
            if (profile?.image_url) {
                const imagePath = profile.image_url.split('/').pop();
                if (imagePath) {
                    await supabase.storage.from('profile_images').remove([imagePath]);
                }
            }

            // Delete profile
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', profileId);

            if (error) throw error;

            toast.success('The profile has been deleted successfully.');

            router.push('/profiles');
            router.refresh();
        } catch (error) {
            console.error('Error deleting profile:', error);
            toast.error('Failed to delete profile. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading profile...</div>;
    }

    if (!profile) {
        return (
            <div className="text-center py-8">
                <p className="mb-4">Profile not found</p>
                <Link href="/profiles">
                    <Button>Back to Profiles</Button>
                </Link>
            </div>
        );
    }

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>{profile.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-center">
                    {profile.image_url ? (
                        <img
                            src={profile.image_url}
                            alt={profile.name}
                            className="w-48 h-48 object-cover rounded-full"
                        />
                    ) : (
                        <div className="w-48 h-48 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full">
                            <span className="text-6xl font-bold text-gray-400">
                                {profile.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Name</h3>
                        <p>{profile.name}</p>
                    </div>

                    {profile.greeting && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Email</h3>
                            <p>{profile.greeting}</p>
                        </div>
                    )}

                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Created</h3>
                        <p>{new Date(profile.created_at).toLocaleDateString()}</p>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                        <p>{profile.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'Not updated'}</p>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="flex justify-between">
                <Link href="/profiles">
                    <Button variant="outline">Back</Button>
                </Link>

                <div className="space-x-2">
                    <Link href={`/profiles/${profile.id}/edit`}>
                        <Button variant="outline">Edit</Button>
                    </Link>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleting}
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}