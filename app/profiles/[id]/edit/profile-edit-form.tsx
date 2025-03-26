'use client';

import { useFormStatus } from 'react-dom';
import { Profile } from '@/types/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

interface ProfileEditFormProps {
    profile: Profile;
    updateProfile: (formData: FormData) => Promise<{ error?: string }>;
    error?: string;
}

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button
            type="submit"
            disabled={pending}
        >
            {pending ? 'Saving...' : 'Save Changes'}
        </Button>
    );
}

export default function ProfileEditForm({ profile, updateProfile, error }: ProfileEditFormProps) {
    const handleSubmit = async (formData: FormData) => {
        const result = await updateProfile(formData);
        console.log(result);
    };

    return (
        <form action={handleSubmit} className="space-y-6">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                    id="name"
                    name="name"
                    defaultValue={profile.name}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="greeting">Greeting</Label>
                <Input
                    id="greeting"
                    name="greeting"
                    defaultValue={profile.greeting || ''}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    defaultValue={profile.bio || ''}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="image_url">Profile Image URL</Label>
                <Input
                    id="image_url"
                    name="image_url"
                    defaultValue={profile.image_url || ''}
                />
                {profile.image_url && (
                    <div className="mt-2">
                        <img
                            src={profile.image_url}
                            alt="Profile preview"
                            className="w-24 h-24 object-cover rounded-md"
                        />
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-4">
                <Button
                    type="button"
                    variant="outline"
                    asChild
                >
                    <Link href={`/profiles/${profile.id}`}>Cancel</Link>
                </Button>
                <SubmitButton />
            </div>
        </form>
    );
} 