'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/profile';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Search } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

export function ProfileList() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function fetchProfiles() {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setProfiles(data || []);
                setFilteredProfiles(data || []);
            } catch (error) {
                console.error('Error fetching profiles:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchProfiles();
    }, []);

    // Filter profiles based on search query
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredProfiles(profiles);
            return;
        }

        const query = searchQuery.toLowerCase().trim();
        const filtered = profiles.filter(profile =>
            profile.name.toLowerCase().includes(query)
        );
        setFilteredProfiles(filtered);
    }, [searchQuery, profiles]);

    const handleDelete = async (profileId: string) => {
        try {
            setDeletingId(profileId);

            // Delete the profile from the database
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', profileId);

            if (error) throw error;

            // Also delete associated files from storage
            await supabase.storage
                .from('profile-images')
                .remove([`profiles/${profileId}`]);

            // Update the UI by removing the deleted profile
            setProfiles(profiles.filter(profile => profile.id !== profileId));
            setFilteredProfiles(filteredProfiles.filter(profile => profile.id !== profileId));

            toast.success("Profile deleted", {
                description: "The profile has been successfully deleted."
            });
        } catch (error) {
            console.error('Error deleting profile:', error);
            toast.error("Error", {
                description: "Failed to delete the profile. Please try again."
            });
        } finally {
            setDeletingId(null);
        }
    };

    // Function to truncate text with ellipsis
    const truncateText = (text: string | null, maxLength: number) => {
        if (!text) return '';
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    };

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
        <div className="space-y-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                    type="text"
                    placeholder="Search profiles by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {filteredProfiles.length === 0 && (
                <div className="text-center py-4">
                    <p>No profiles match your search</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProfiles.map((profile) => (
                    <Card key={profile.id} className="overflow-hidden flex flex-col">
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
                        <CardContent className="p-4 flex-grow">
                            <h3 className="text-lg font-semibold">{profile.name}</h3>
                            {profile.greeting && (
                                <p className="text-sm text-gray-500 mt-1">{profile.greeting}</p>
                            )}
                            {profile.bio && (
                                <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">
                                    {truncateText(profile.bio, 100)}
                                </p>
                            )}
                        </CardContent>
                        <CardFooter className="p-4 pt-0 flex justify-between border-t">
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/profiles/${profile.id}`}>View</Link>
                                </Button>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/profiles/${profile.id}/edit`}>Edit</Link>
                                </Button>
                            </div>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                        disabled={deletingId === profile.id}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Profile</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to delete this profile? This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => handleDelete(profile.id)}
                                            className="bg-red-500 hover:bg-red-600"
                                        >
                                            {deletingId === profile.id ? 'Deleting...' : 'Delete'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}