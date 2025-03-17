"use client"

import { Sidebar } from "@/components/ui/sidebar"
import { User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import Link from "next/link";

interface Test{
  users: User[];
}

export default function Profile({users}:Test) {

  const imageStyle = {
    borderRadius: '50%',
    border: '1px solid #fff',
  }

  function handleClick(arg0: string): void {
    throw new Error("Function not implemented.");
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar imported from sidebar.tsx */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 bg-gray-100">
        {/* Updated header with Admin text */}
        <div className="p-8">
          <div className="flex items-baseline gap-4 mb-4">
            <h1 className="text-5xl font-bold text-[#333333]">User Profile</h1>
            <span className="text-4xl font-bold text-[#8B2332]">Admin</span>
          </div>
          
          {/* Actual start of main contents*/}

          <div className="p-3 m-5">
            <div className="flex items-center">
              <div className="pr-1">
                <img
                src="https://placehold.co/200"
                style={imageStyle}
                sizes="(max-width: 200px) 100vw, (max-width: 200px) 50vw, 33vw"
                placeholder="blur"
                />
              </div>
              <div className="pl-5">
                {/*supposed to print out current user's name and */}
                <span className="text-4xl   font-bold text-[#8B2332] leading-[1.3]">John Doe</span>
                <h1   className="text-5xl   font-bold text-[#333333] leading-[1]">Accountant</h1>
                <h5   className="text-xl    font-bold                leading-[1.1]">JohnDoe@gmail.com</h5>
              </div>



            </div>

              {/*Buttons???*/}
              <div className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* <Link href="user_img.tsx"> */}
                  <Button className="w-60 bg-[#8B2332] hover:bg-[#9f393b] text-white flex items-center">
                    Edit Profile Picture
                  </Button>
                  {/* </Link> */}

                  <Button className="w-60 bg-[#8B2332] hover:bg-[#9f393b] text-white flex items-center" 
                    onClick={() => handleClick("button2")}>
                    Switch to Task Reciever Menu
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 pt-5">
                <Button className="w-60 bg-[#8B2332] hover:bg-[#9f393b] text-white flex items-center"
                    onClick={() => handleClick("button3")}>
                    Reset Password
                  </Button>

                  <Button className="w-60 bg-[#8B2332] hover:bg-[#9f393b] text-white flex items-center"
                    onClick={() => handleClick("button4")}>
                    Log Out
                  </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>    
  )
}

