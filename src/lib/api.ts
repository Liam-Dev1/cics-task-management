import { taskData as sampleData } from "./sample-data"

export async function fetchTaskData() {
  // Simulating an API call with a delay
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulating a successful API call
      resolve(sampleData)

      // Uncomment the following line to simulate an error
      // reject(new Error('Failed to fetch task data'));
    }, 1000)
  })
}

export async function fetchAverageCompletionTimeData(timeFrame: string) {
  // Simulating an API call with a delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(sampleData.averageCompletionTimeData[timeFrame])
    }, 500)
  })
}

