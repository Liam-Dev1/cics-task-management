import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { setGlobalOptions } from 'firebase-functions/v2/options';

admin.initializeApp();
setGlobalOptions({ region: 'us-central1' });

interface Task {
  status: string;
  [key: string]: any;
}

export const archiveCompletedTask = onDocumentUpdated(
  'tasks/{taskId}',
  async (event) => {
    const db = admin.firestore();
    const beforeData = event.data?.before.data() as Task;
    const afterData = event.data?.after.data() as Task;
    const taskId = event.params.taskId;

    // Only proceed if status changed to a completed state
    const completedStatuses = ['completed on time', 'completed overdue'];
    if (
      beforeData.status !== afterData.status &&
      completedStatuses.includes(afterData.status)
    ) {
      try {
        // Add to archive collection with additional metadata
        await db.collection('archivedTasks').doc(taskId).set({
          ...afterData,
          archivedAt: admin.firestore.FieldValue.serverTimestamp(),
          originalTaskId: taskId
        });

        console.log(`Successfully archived task ${taskId}`);
      } catch (error) {
        console.error(`Error archiving task ${taskId}:`, error);
        throw error;
      }
    }
  }
);