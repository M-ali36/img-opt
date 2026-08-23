"use client"

import React, { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { auth, db } from "@/firebase/config";
import { signOut } from "firebase/auth";
import { Image, LogOut, Smile } from 'react-feather';
import Link from 'next/link';
import { doc, getDoc } from "firebase/firestore";

const UserHeader = props => {
    const router = useRouter();

    const [userName, setUserName] = useState("");
    
    /* ----------------------------------
        LOAD USER NAME FROM FIRESTORE
    ----------------------------------- */
    useEffect(() => {
        const fetchUser = async () => {
            const user = auth.currentUser;
            if (!user) return;

            const snap = await getDoc(doc(db, "users", user.uid));
            if (snap.exists()) {
                setUserName(snap.data().fullName || "User");
            }
        };

        fetchUser();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            await fetch("/api/logout", { method: "POST" });
            router.push("/");
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    return (
        <header className="h-16 flex items-center justify-between p-4 border-b border-[#2e3d55] bg-[#161b22] sticky top-0 z-30">

            <div className="flex items-center max-w-62 mx-4 text-white">
                <Image className="w-8 h-8 me-4"/>
                Image Resizer 
            </div>

            <div className="flex items-center gap-4 text-white mx-4">
                <Link href="/user/">Projects</Link>
                <Link href="/user/setting">Settings</Link>
            </div>

            <div className="flex items-center ">
                <div className="flex gap-2 text-white whitespace-nowrap mx-4">
                    <Smile />
                    Welcome {userName || "User"}
                </div>

                <button className="btn-primary flex gap-2" onClick={handleLogout}>
                    <LogOut className="w-4" />
                    Logout
                </button>
            </div>
        </header>
    );
};

UserHeader.propTypes = {
    
};

export default UserHeader;