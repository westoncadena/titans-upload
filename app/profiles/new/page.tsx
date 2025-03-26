import { Metadata } from 'next';
import Link from 'next/link';
import { ProfileForm } from '@/components/profile-form';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
    title: 'Create Profile | Titans Upload',
    description: 'Create a new profile',
};

export default function CreateProfilePage() {
    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <Link href="/profiles">
                    <Button variant="outline" size="sm">
                        ← Back to Profiles
                    </Button>
                </Link>
            </div>

            <div className="max-w-md mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-center">Create Profile</h1>
                <ProfileForm />
            </div>
        </div>
    );
}