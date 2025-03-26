'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { ProfileFormData, Profile } from '@/types/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

export function ProfileEditForm({ profile }: { profile: Profile }) {
    const router = useRouter();
    const [formData, setFormData] = useState<ProfileFormData>({
        name: profile.name || '',
        greeting: profile.greeting || '',
        bio: profile.bio || '',
    });
    const [imagePreview, setImagePreview] = useState<string | null>(profile.image_url || null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [imageError, setImageError] = useState<string | null>(null);
    const [imageChanged, setImageChanged] = useState(false);

    const { getRootProps, getInputProps } = useDropzone({
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
        },
        maxFiles: 1,
        onDrop: (acceptedFiles) => {
            const file = acceptedFiles[0];
            setFormData((prev) => ({ ...prev, image: file }));
            setImageChanged(true);
            // Clear any previous image errors when a new image is uploaded
            setImageError(null);

            // Create preview
            const reader = new FileReader();
            reader.onload = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        },
    });

    // Function to toggle camera
    const toggleCamera = async () => {
        if (isCameraActive) {
            // Stop the camera
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
            setIsCameraActive(false);
        } else {
            try {
                // Start the camera
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setIsCameraActive(true);
            } catch (err) {
                console.error("Error accessing camera:", err);
                toast.error("Camera Error", {
                    description: "Could not access your camera. Please check permissions."
                });
            }
        }
    };

    // Function to capture image from camera
    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw the current video frame to the canvas
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Convert canvas to blob
                canvas.toBlob((blob) => {
                    if (blob) {
                        // Create a File object from the blob
                        const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });

                        // Update form data with the captured image
                        setFormData(prev => ({ ...prev, image: file }));

                        // Create preview
                        const reader = new FileReader();
                        reader.onload = () => {
                            setImagePreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);

                        // Stop the camera after capturing
                        toggleCamera();
                    }
                }, 'image/jpeg', 0.95);
            }
        }
    };

    // Clean up camera on unmount
    useEffect(() => {
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Function to check if the form is valid and complete
    const isFormValid = () => {
        return (
            formData.name.trim() !== '' &&
            formData.greeting.trim() !== '' &&
            formData.bio.trim() !== '' &&
            // Only require image if it's a new upload and the profile doesn't already have one
            (!!imagePreview || !!formData.image) &&
            !imageError
        );
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

            // Upload image if provided and changed
            let image_url = profile.image_url;
            let face_encoding = null; // Reset face encoding to force regeneration

            if (formData.image && imageChanged) {
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
                        description: 'There was a problem uploading your image. Profile will be updated without changing the image.'
                    });
                    // Continue without changing the image
                    image_url = profile.image_url;
                }
            }

            // Generate face encoding regardless of whether image was changed
            if (image_url) {
                try {
                    console.log('Attempting to generate face encoding for:', image_url);

                    // Call your serverless function to generate face encoding with proper error handling
                    const response = await fetch('/api/generate-face-encoding', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ imageUrl: image_url }),
                    });

                    const responseData = await response.json();

                    if (!response.ok) {
                        console.error('Face encoding API error:', responseData);

                        // Handle specific face detection errors
                        if (response.status === 422 && responseData.error?.includes('No face detected')) {
                            throw new Error('No face detected in the image. Please upload a photo with a clearly visible face.');
                        } else if (response.status === 400 && responseData.error?.includes('Multiple faces detected')) {
                            throw new Error('Multiple faces detected. Please upload a photo with only one face.');
                        } else {
                            throw new Error(responseData.error || 'Failed to generate face encoding. Please try again or select a different photo.');
                        }
                    }

                    face_encoding = responseData.encoding;
                    console.log('Face encoding generated successfully');
                } catch (encodingError: any) {
                    console.error('Face encoding error:', encodingError);

                    // Show specific error message based on the error type
                    const errorMessage = encodingError.message || 'Could not generate face encoding. Please try again or select a different photo.';

                    // For all face encoding errors, show an error and prevent profile update
                    toast.error('Face Recognition Error', {
                        description: errorMessage
                    });

                    // Set error state to display in the UI
                    setImageError(errorMessage);

                    // Return early to prevent profile update without face encoding
                    setIsSubmitting(false);
                    return;
                }
            }

            // Create profile data object
            const profileData = {
                name: formData.name,
                greeting: formData.greeting,
                bio: formData.bio,
                image_url,
                face_encoding,
            };

            console.log('Attempting to update profile with data:', profileData);

            // Update profile
            const { data: updatedProfile, error } = await supabase
                .from('profiles')
                .update(profileData)
                .eq('id', profile.id)
                .select();

            if (error) {
                console.error('Profile update error:', error);
                throw error;
            }

            console.log('Profile updated successfully:', updatedProfile);

            toast.success('Profile updated', {
                description: 'Your profile has been updated successfully.',
            });

            // Redirect back to profile page
            router.push(`/profiles/${profile.id}`);
            router.refresh();
        } catch (error: any) {
            console.error('Error updating profile:', error);

            // More detailed error message
            let errorMessage = 'Failed to update profile. Please try again.';
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
                <CardTitle>Edit Profile</CardTitle>
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
                            placeholder="Enter name"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="greeting">Greeting</Label>
                        <Input
                            id="greeting"
                            name="greeting"
                            value={formData.greeting}
                            onChange={handleChange}
                            required
                            placeholder="Enter greeting message"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Tell us about this person..."
                            rows={4}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Profile Image <span className="text-red-500">*</span></Label>

                        {isCameraActive ? (
                            <div className="space-y-2">
                                <div className="relative rounded-md overflow-hidden aspect-video">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex justify-between">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={toggleCamera}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={captureImage}
                                    >
                                        Capture
                                    </Button>
                                </div>
                                <canvas ref={canvasRef} className="hidden" />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div
                                    {...getRootProps()}
                                    className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${imageError
                                        ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                                        : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                                        }`}
                                >
                                    <input {...getInputProps()} />
                                    {imagePreview ? (
                                        <div className="flex flex-col items-center">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className={`w-32 h-32 object-cover rounded-full mb-2 ${imageError ? 'border-2 border-red-500' : ''}`}
                                            />
                                            <p className="text-sm text-gray-500">Click or drag to replace</p>
                                            {imageError && (
                                                <div className="mt-2 text-red-500 text-sm">
                                                    <p className="font-medium">Error: {imageError}</p>
                                                    <p className="mt-1">Please upload a different photo with a single, clearly visible face.</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <svg
                                                className={`w-12 h-12 ${imageError ? 'text-red-500' : 'text-gray-400'}`}
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
                                            <p className={`mt-2 text-sm ${imageError ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                                                {imageError ? 'Please upload a new image' : 'Click or drag and drop to upload an image'}
                                            </p>
                                            {imageError && (
                                                <p className="mt-1 text-sm text-red-500">
                                                    {imageError}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                        setImageError(null);
                                        toggleCamera();
                                    }}
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Use Camera
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-2">
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting || isCameraActive || !!imageError || !isFormValid()}
                    >
                        {isSubmitting ? 'Updating...' : 'Update Profile'}
                    </Button>

                    {!isFormValid() && !isSubmitting && !isCameraActive && !imageError && (
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                            Please fill out all fields to continue.
                        </p>
                    )}
                </CardFooter>
            </form>
        </Card>
    );
}