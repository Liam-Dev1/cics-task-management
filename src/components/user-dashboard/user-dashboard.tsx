'use client'
import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/router"
import { auth, googleProvider } from "@/app/firebase/firebase.config"
import { signInWithPopup } from "firebase/auth"

const Dashboard: React.FC = () => {
    return (
        <div>
            {/* Your dashboard content */}
            <h1>Welcome to the Dashboard</h1>
        </div>
    );
};

export default Dashboard;