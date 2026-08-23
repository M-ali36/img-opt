import UserHeader from '@/components/UserHeader';
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Layout({children}) {

    const cookieStore = await cookies();
    
    const token = cookieStore.get("auth_token")?.value || null;
    const role  = cookieStore.get("auth_role")?.value || null;

    if (!token) redirect("/");
    if (role !== "user") redirect("/");
    
    return (       
        <div className="min-h-screen">
            <UserHeader />
            <main className="p-4 md:p-8">
                {children}
            </main>

            <footer className="p-4 text-center text-sm text-gray-500 border-t border-[#2e3d55] mt-8">
                &copy; 2025 Aether Panel. All rights reserved. Creative Layout by Gemini.
            </footer>
        </div>
    );
};
