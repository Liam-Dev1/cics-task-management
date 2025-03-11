import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()

  // Here you would typically save the support request to a database
  // For this example, we'll just log it and return a success message
  console.log("Support request received:", body)

  return NextResponse.json({ message: "Support request submitted successfully" })
}

