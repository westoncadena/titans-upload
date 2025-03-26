import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Profile } from '@/types/profile';

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
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

    // Type assertion to ensure profile matches our interface
    const typedProfile = profile as unknown as Profile;

    return (
        <div className="container max-w-3xl py-10">
            <Button variant="ghost" size="sm" asChild className="mb-6">
                <Link href="/profiles" className="flex items-center">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to profiles
                </Link>
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">{typedProfile.name}</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    {typedProfile.image_url && (
                        <div className="w-full max-w-md mx-auto">
                            <img
                                src={typedProfile.image_url}
                                alt={typedProfile.name}
                                className="rounded-md w-full object-cover aspect-square"
                            />
                        </div>
                    )}

                    {typedProfile.greeting && (
                        <div>
                            <h3 className="font-medium text-sm text-muted-foreground">Greeting</h3>
                            <p>{typedProfile.greeting}</p>
                        </div>
                    )}

                    {typedProfile.bio && (
                        <div>
                            <h3 className="font-medium text-sm text-muted-foreground">Bio</h3>
                            <p className="whitespace-pre-line">{typedProfile.bio}</p>
                        </div>
                    )}

                    <div>
                        <h3 className="font-medium text-sm text-muted-foreground">Created</h3>
                        <p>{new Date(typedProfile.created_at).toLocaleDateString()}</p>
                    </div>
                </CardContent>

                <CardFooter>
                    <Button asChild>
                        <Link href={`/profiles/${resolvedParams.id}/edit`} className="flex items-center">
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Profile
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
} 