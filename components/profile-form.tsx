'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { ProfileFormData } from '@/types/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export function ProfileForm() {
    const router = useRouter();
    const [formData, setFormData] = useState<ProfileFormData>({
        name: '',
        greeting: '',
    });
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { getRootProps, getInputProps } = useDropzone({
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
        },
        maxFiles: 1,
        onDrop: (acceptedFiles) => {
            const file = acceptedFiles[0];
            setFormData((prev) => ({ ...prev, image: file }));

            // Create preview
            const reader = new FileReader();
            reader.onload = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        },
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Check connection first
            try {
                const { error: pingError } = await supabase.from('profiles').select('count').limit(1);
                if (pingError) {
                    console.error('Connection test failed:', pingError);
                    throw new Error('Cannot connect to database. Please check your network connection.');
                }
            } catch (connectionError) {
                console.error('Connection error:', connectionError);
                toast.error('Connection Error', {
                    description: 'Cannot connect to the database. Please check your network connection.'
                });
                setIsSubmitting(false);
                return;
            }

            // Upload image if provided
            let image_url = null;
            if (formData.image) {
                try {
                    const fileExt = formData.image.name.split('.').pop();
                    const fileName = `${uuidv4()}.${fileExt}`;
                    const filePath = `${fileName}`;

                    // Log upload attempt
                    console.log('Attempting to upload image:', fileName);

                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('profile_images')
                        .upload(filePath, formData.image);

                    if (uploadError) {
                        console.error('Image upload error:', uploadError);
                        throw uploadError;
                    }

                    console.log('Image uploaded successfully:', uploadData);

                    // Get public URL
                    const { data } = supabase.storage
                        .from('profile_images')
                        .getPublicUrl(filePath);

                    image_url = data.publicUrl;
                    console.log('Image public URL:', image_url);
                } catch (imageError) {
                    console.error('Image processing error:', imageError);
                    toast.error('Image Upload Failed', {
                        description: 'There was a problem uploading your image. Profile will be created without an image.'
                    });
                    // Continue without image
                }
            }

            // Create profile data object
            const profileData = {
                name: formData.name,
                greeting: formData.greeting,
                image_url,
            };

            console.log('Attempting to create profile with data:', profileData);

            // Create profile - rename the returned data variable
            const { data: createdProfile, error } = await supabase
                .from('profiles')
                .insert(profileData)
                .select();

            if (error) {
                console.error('Profile creation error:', error);
                throw error;
            }

            console.log('Profile created successfully:', createdProfile);

            toast.success('Profile created', {
                description: 'Your profile has been created successfully.',
            });

            // Redirect or reset form
            router.push('/profiles');
            router.refresh();
        } catch (error: any) {
            console.error('Error creating profile:', error);

            // More detailed error message
            let errorMessage = 'Failed to create profile. Please try again.';
            if (error?.message) {
                errorMessage += ` Error: ${error.message}`;
            }

            toast.error('Error', {
                description: errorMessage,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Create Profile</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="greeting">Greeting</Label>
                        <Input
                            id="greeting"
                            name="greeting"
                            value={formData.greeting}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Profile Image</Label>
                        <div
                            {...getRootProps()}
                            className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md p-6 text-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
                        >
                            <input {...getInputProps()} />
                            {imagePreview ? (
                                <div className="flex flex-col items-center">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-32 h-32 object-cover rounded-full mb-2"
                                    />
                                    <p className="text-sm text-gray-500">Click or drag to replace</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <svg
                                        className="w-12 h-12 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                        />
                                    </svg>
                                    <p className="mt-2 text-sm text-gray-500">
                                        Click or drag and drop to upload an image
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>

                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Profile'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}