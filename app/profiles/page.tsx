import { Metadata } from 'next';
import Link from 'next/link';
import { ProfileList } from '@/components/profile-list';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
    title: 'Profiles | Titans Upload',
    description: 'Manage your profiles',
};

export default function ProfilesPage() {
    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Profiles</h1>
                <Link href="/profiles/new">
                    <Button>Create Profile</Button>
                </Link>
            </div>

            <ProfileList />
        </div>
    );
}