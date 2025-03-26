import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-73px)] p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Titans Upload</h1>
        <p className="text-xl mb-8">
          A simple profile management system with image upload capabilities.
        </p>
        <Link href="/profiles">
          <Button size="lg">View Profiles</Button>
        </Link>
      </div>
    </div>
  );
}