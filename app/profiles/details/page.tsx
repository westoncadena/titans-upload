import { Metadata } from 'next';
import { ProfileDetail } from '@/components/profile-detail';

interface ProfilePageProps {
    params: Promise<{
        id: string;
    }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
    return {
        title: 'Profile Details | Titans Upload',
        description: 'View profile details',
    };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const resolvedParams = await params;

    return (
        <div className="container mx-auto py-8 px-4">
            <ProfileDetail profileId={resolvedParams.id} />
        </div>
    );
}