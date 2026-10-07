"use client";
import { GalleryVerticalEnd } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { SignupForm } from "@/components/signup-form";

/**
 * Render the signup page and redirect authenticated users to the home route.
 *
 * Uses authentication context to check `user` and `loading`; if authentication is still loading the component renders `null`, and if a user is present it navigates to `/`. When unauthenticated and not loading, it renders the signup layout with branding and the `SignupForm` component.
 *
 * @returns The signup page JSX element, or `null` while authentication state is loading.
 */
export default function SignupPage() {
	const { user, loading } = useAuth();

	const router = useRouter();

	useEffect(() => {
		if (!loading && user) {
			router.push("/");
		}
	}, [user, loading, router]);
	if (loading) return null;
	return (
		<div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
			<div className="flex w-full max-w-sm flex-col gap-6">
				{/* Same mark as the login page — see the note there on why indigo-600
				    rather than the lighter accent step. */}
				<Link
					href="/"
					className="flex items-center gap-2 self-center font-medium"
				>
					<div className="flex size-6 items-center justify-center rounded-md bg-indigo-600 text-white">
						<GalleryVerticalEnd className="size-4" />
					</div>
					AI Dictionary
				</Link>
				<SignupForm />
			</div>
		</div>
	);
}
