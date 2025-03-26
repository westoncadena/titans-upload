'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/profile';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function ProfileList() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProfiles() {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setProfiles(data || []);
            } catch (error) {
                console.error('Error fetching profiles:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchProfiles();
    }, []);

    if (loading) {
        return <div className="text-center py-8">Loading profiles...</div>;
    }

    if (profiles.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="mb-4">No profiles found</p>
                <Link href="/profiles/new">
                    <Button>Create Profile</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => (
                <Card key={profile.id} className="overflow-hidden">
                    <div className="aspect-square relative">
                        {profile.image_url ? (
                            <img
                                src={profile.image_url}
                                alt={profile.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                                <span className="text-4xl font-bold text-gray-400">
                                    {profile.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                    <CardContent className="p-4">
                        <h3 className="text-lg font-semibold">{profile.name}</h3>
                        {profile.greeting && <p className="text-sm text-gray-500">{profile.greeting}</p>}
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-between">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/profiles/${profile.id}`}>View</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/profiles/${profile.id}/edit`}>Edit</Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}