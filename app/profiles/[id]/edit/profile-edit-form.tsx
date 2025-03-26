'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ProfileEditFormProps {
    profile: Profile;
    updateProfile: (formData: FormData) => Promise<{ error?: string }>;
}

export default function ProfileEditForm({ profile, updateProfile }: ProfileEditFormProps) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: profile.name || '',
        greeting: profile.greeting || '',
        bio: profile.bio || '',
        image_url: profile.image_url || '',
    });
    const [newImage, setNewImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(profile.image_url || null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const { getRootProps, getInputProps } = useDropzone({
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
        },
        maxFiles: 1,
        onDrop: (acceptedFiles) => {
            const file = acceptedFiles[0];
            setNewImage(file);

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
                        setNewImage(file);

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
        e.preventDefault(); // Prevent any default form behavior
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            console.log('Starting profile update process');

            // Upload new image if provided
            let image_url = formData.image_url;
            let face_encoding = profile.face_encoding;

            if (newImage) {
                try {
                    const fileExt = newImage.name.split('.').pop();
                    const fileName = `${uuidv4()}.${fileExt}`;
                    const filePath = `${fileName}`;

                    // Log upload attempt
                    console.log('Attempting to upload new image:', fileName);

                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('profile_images')
                        .upload(filePath, newImage);

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
                    console.log('New image public URL:', image_url);

                    // After successful image upload, generate face encoding
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
                                throw new Error(responseData.error || 'Failed to generate face encoding');
                            }

                            face_encoding = responseData.encoding;
                            console.log('Face encoding generated successfully');

                            // Log the structure of the encoding to verify it's in the correct format
                            console.log('Face encoding type:', typeof face_encoding);
                            console.log('Face encoding is array?', Array.isArray(face_encoding));
                            if (typeof face_encoding === 'string') {
                                try {
                                    // If it's a string, try to parse it as JSON
                                    const parsed = JSON.parse(face_encoding);
                                    console.log('Parsed face encoding:', parsed);
                                    face_encoding = parsed; // Use the parsed object instead
                                } catch (parseError) {
                                    console.error('Error parsing face encoding string:', parseError);
                                    // Keep the original string if parsing fails
                                }
                            }
                        } catch (encodingError) {
                            console.error('Face encoding error:', encodingError);
                            toast.warning('Face Recognition', {
                                description: 'Could not generate face encoding. Profile will be updated without face recognition.'
                            });
                            // Continue without face encoding
                        }
                    }
                } catch (imageError) {
                    console.error('Image processing error:', imageError);
                    toast.error('Image Upload Failed', {
                        description: 'There was a problem uploading your image. Profile will be updated without changing the image.'
                    });
                    // Continue without changing image
                }
            }

            // Create form data for server action
            const serverFormData = new FormData();
            serverFormData.append('name', formData.name);
            serverFormData.append('greeting', formData.greeting);
            serverFormData.append('bio', formData.bio);
            serverFormData.append('image_url', image_url || '');

            // Add face_encoding to the form data if we have it
            if (face_encoding) {
                // For JSONB type, ensure it's properly stringified
                const encodingString = typeof face_encoding === 'string'
                    ? face_encoding
                    : JSON.stringify(face_encoding);
                serverFormData.append('face_encoding', encodingString);
                console.log('Added face encoding to form data (JSONB format)');
            }

            console.log('Prepared form data for server action', {
                name: formData.name,
                greeting: formData.greeting,
                bio: formData.bio,
                image_url: image_url || '',
                face_encoding: face_encoding ? 'present (JSONB)' : 'not included'
            });

            // We no longer need to update face_encoding separately with Supabase client
            // since we're now passing it to the server action

            // Call the server action to update the profile
            const result = await updateProfile(serverFormData);

            if (result.error) {
                throw new Error(result.error);
            }

            toast.success('Profile updated', {
                description: 'Your profile has been updated successfully.',
            });

            // Only redirect if there was no error
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
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell us about this person..."
                    rows={4}
                />
            </div>

            <div className="space-y-2">
                <Label>Profile Image</Label>

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
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={toggleCamera}
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

            <div className="flex justify-end space-x-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting || isCameraActive}
                >
                    {isSubmitting ? 'Updating...' : 'Update Profile'}
                </Button>
            </div>
        </form>
    );
}