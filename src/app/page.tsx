import Image from "next/image"
import { Search } from "lucide-react"

export default function HelpAndSupport() {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-[160px] bg-[#333333] text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Image src="/placeholder.svg?height=24&width=24" alt="CICS Logo" width={24} height={24} />
            <div className="text-xs leading-tight">
              <div className="font-bold">CICS</div>
              <div className="text-[10px]">Personnel Task Monitoring</div>
              <div className="text-[10px]">and Management System</div>
            </div>
          </div>
        </div>

        <nav className="flex-1">
          <div className="py-4 px-6 hover:bg-gray-700 cursor-pointer">Dashboard</div>
          <div className="py-4 px-6 hover:bg-gray-700 cursor-pointer">Tasks</div>
          <div className="py-4 px-6 hover:bg-gray-700 cursor-pointer">User</div>
          <div className="py-4 px-6 bg-gray-700 cursor-pointer">Help</div>
          <div className="mt-auto py-4 px-6 hover:bg-gray-700 cursor-pointer">Log Out</div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-5xl font-bold text-[#333333] mb-8">Help and Support</h1>

          {/* Search and Navigation */}
          <div className="flex gap-2 mb-8">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search"
                className="w-full px-4 py-2 pr-10 bg-[#333333] text-white rounded-md"
              />
              <Search className="absolute right-3 top-2.5 text-white" size={18} />
            </div>
            <button className="px-4 py-2 bg-[#8B2A2A] text-white rounded-md">FAQ</button>
            <button className="px-4 py-2 bg-[#333333] text-white rounded-md">Manual</button>
            <button className="px-4 py-2 bg-[#333333] text-white rounded-md">Contact Support</button>
          </div>

          {/* FAQ Content */}
          <div>
            <h2 className="text-3xl font-bold text-[#333333] mb-6">FAQ</h2>

            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg">Q: Lorem ipsum dolor sit amet?</h3>
                <p>
                  A: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus efficitur mauris vel nulla
                  volutpat, ac ullamcorper sapien ultricies.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-lg">Q: Sed ut perspiciatis unde omnis iste natus error?</h3>
                <p>
                  A: Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut
                  aliquid ex ea commodi consequatur.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-lg">Q: Qui officia deserunt mollit anim id est laborum?</h3>
                <p>
                  A: Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et
                  voluptates repudiandae sint et molestiae non recusandae.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-lg">Q: Nisi ut aliquid ex ea commodi consequatur?</h3>
                <p>
                  A: Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur
                  magni dolores eos qui ratione voluptatem sequi nesciunt.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

