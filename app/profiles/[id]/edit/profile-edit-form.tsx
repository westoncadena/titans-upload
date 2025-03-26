'use client';

import { useState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Profile } from '@/types/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Camera, Upload } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';

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
    const [imagePreview, setImagePreview] = useState<string | null>(profile.image_url || null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [newImageFile, setNewImageFile] = useState<File | null>(null);
    const [shouldRegenerateEncoding, setShouldRegenerateEncoding] = useState(true);

    const { getRootProps, getInputProps } = useDropzone({
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
        },
        maxFiles: 1,
        onDrop: (acceptedFiles) => {
            const file = acceptedFiles[0];
            setNewImageFile(file);

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
                alert("Could not access your camera. Please check permissions.");
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
                        setNewImageFile(file);

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

    const handleSubmit = async (formData: FormData) => {
        // If we have a new image file, add it to the form data
        if (newImageFile) {
            formData.append('image_file', newImageFile);
        }

        // Always regenerate face encoding
        formData.append('regenerate_encoding', 'true');

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
                <div className="flex items-center justify-between">
                    <Label htmlFor="regenerate_encoding">Face Recognition</Label>
                    <div className="text-sm text-muted-foreground">
                        Always regenerate face encoding
                    </div>
                </div>

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
                                        alt="Profile preview"
                                        className="w-32 h-32 object-cover rounded-full mb-2"
                                    />
                                    <p className="text-sm text-gray-500">Click or drag to replace</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <Upload className="w-12 h-12 text-gray-400" />
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
                            <Camera className="mr-2 h-4 w-4" />
                            Use Camera
                        </Button>

                        {/* Hidden input for the original image URL */}
                        <Input
                            type="hidden"
                            name="image_url"
                            value={profile.image_url || ''}
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