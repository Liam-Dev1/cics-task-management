import { Sidebar } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronUp, Search, FileText } from "lucide-react"

export default function TasksPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-white">
        <div className="p-8">
          <h1 className="text-5xl font-bold text-zinc-800 mb-6">Tasks</h1>

          <div className="flex gap-2 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 h-5 w-5" />
              <Input placeholder="Search Tasks" className="pl-10 bg-zinc-100 border-zinc-200 h-12" />
            </div>
            <Button variant="outline" className="h-12 px-4 flex items-center gap-2 bg-zinc-100 border-zinc-200">
              Filters
              <ChevronDown className="h-5 w-5" />
            </Button>
            <Button variant="outline" className="h-12 px-4 flex items-center gap-2 bg-zinc-100 border-zinc-200">
              Sort
              <ChevronDown className="h-5 w-5" />
            </Button>
          </div>

          <h2 className="text-xl font-semibold text-zinc-800 mb-4">Tasks</h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left border-b border-zinc-200">
                  <th className="pb-2 font-medium text-zinc-700">Task Name</th>
                  <th className="pb-2 font-medium text-zinc-700">Assigned by</th>
                  <th className="pb-2 font-medium text-zinc-700">Assigned to</th>
                  <th className="pb-2 font-medium text-zinc-700">Assigned on</th>
                  <th className="pb-2 font-medium text-zinc-700">Deadline</th>
                  <th className="pb-2 font-medium text-zinc-700">Status</th>
                  <th className="pb-2 font-medium text-zinc-700">Priority</th>
                </tr>
              </thead>
              <tbody>
                {/* Task 1 */}
                <tr className="border-b border-zinc-200">
                  <td className="py-4">
                    <div className="flex items-center">
                      <Button variant="ghost" className="p-0 mr-2">
                        <ChevronUp className="h-5 w-5 text-red-600" />
                      </Button>
                      <span className="font-medium text-red-600">Take Pictures of Spider-Man</span>
                    </div>
                  </td>
                  <td className="py-4">J Jonah Jameson</td>
                  <td className="py-4">Peter Parker</td>
                  <td className="py-4">10/30/2024</td>
                  <td className="py-4">11/04/2024</td>
                  <td className="py-4">
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">Verifying</span>
                  </td>
                  <td className="py-4">
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">High</span>
                  </td>
                </tr>

                {/* Task 1 Details */}
                <tr className="bg-zinc-50">
                  <td colSpan={7} className="p-4">
                    <div className="flex flex-col gap-4">
                      <p className="text-zinc-700">
                        Listen here, Parker! I don't pay you to sit around! I need pictures—good pictures of Spider-Man!
                        Not blurry, not half-in-the-shadows, not one of those artsy shots you think look so clever! Give
                        me something with action, something that'll sell papers! And I need it by tonight! Got it?
                      </p>
                      <div className="flex justify-between">
                        <div>
                          <Button variant="outline" className="bg-zinc-200 border-zinc-300">
                            <FileText className="h-4 w-4 mr-2" />
                            Attached File
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <div className="relative">
                            <select className="appearance-none bg-zinc-800 text-white px-4 py-2 pr-8 rounded-md">
                              <option>Completed</option>
                              <option>In Progress</option>
                              <option>Verifying</option>
                              <option>Overdue</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white h-4 w-4" />
                          </div>
                          <Button className="bg-zinc-800 text-white hover:bg-zinc-700">
                            <FileText className="h-4 w-4 mr-2" />
                            Attach Files
                          </Button>
                          <Button className="bg-red-600 text-white hover:bg-red-700">Verifying Completion</Button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Task 2 */}
                <tr className="border-b border-zinc-200">
                  <td className="py-4">
                    <div className="flex items-center">
                      <Button variant="ghost" className="p-0 mr-2">
                        <ChevronDown className="h-5 w-5 text-red-600" />
                      </Button>
                      <span className="font-medium">Buy Shawarma Machine</span>
                    </div>
                  </td>
                  <td className="py-4">Jabdul Mohammed</td>
                  <td className="py-4">Juan Cruz</td>
                  <td className="py-4">10/30/2024</td>
                  <td className="py-4">11/10/2024</td>
                  <td className="py-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">In Progress</span>
                  </td>
                  <td className="py-4">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Low</span>
                  </td>
                </tr>

                {/* Task 3 */}
                <tr className="border-b border-zinc-200">
                  <td className="py-4">
                    <div className="flex items-center">
                      <Button variant="ghost" className="p-0 mr-2">
                        <ChevronDown className="h-5 w-5 text-red-600" />
                      </Button>
                      <span className="font-medium">Repair Aircon in 1905</span>
                    </div>
                  </td>
                  <td className="py-4">Shihoko Hirata</td>
                  <td className="py-4">Jason Ong</td>
                  <td className="py-4">10/30/2024</td>
                  <td className="py-4">11/10/2024</td>
                  <td className="py-4">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Completed</span>
                  </td>
                  <td className="py-4">
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">Medium</span>
                  </td>
                </tr>

                {/* Task 4 */}
                <tr className="border-b border-zinc-200">
                  <td className="py-4">
                    <div className="flex items-center">
                      <Button variant="ghost" className="p-0 mr-2">
                        <ChevronDown className="h-5 w-5 text-red-600" />
                      </Button>
                      <span className="font-medium">Find my car</span>
                    </div>
                  </td>
                  <td className="py-4">Roronoa Zoro</td>
                  <td className="py-4">Nami</td>
                  <td className="py-4">07/18/2024</td>
                  <td className="py-4">08/12/2024</td>
                  <td className="py-4">
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">Overdue</span>
                  </td>
                  <td className="py-4">
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">High</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}