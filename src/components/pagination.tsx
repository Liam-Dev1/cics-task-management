import { Button } from "@/components/ui/button"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
        <Button
          key={pageNumber}
          variant="secondary"
          className={`w-10 h-10 ${
            currentPage === pageNumber
              ? "bg-zinc-800 text-white hover:bg-zinc-700"
              : "bg-zinc-600 text-white hover:bg-zinc-700"
          }`}
          onClick={() => onPageChange(pageNumber)}
        >
          {pageNumber}
        </Button>
      ))}
    </div>
  )
}

