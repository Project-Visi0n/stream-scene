// client/shared/services/contentSchedulerService.ts
import { ContentProject, ProjectCenterFile, ProjectCenterDrawing } from '../types/contentScheduler';

class ContentSchedulerService {
  generateMockProjects(): ContentProject[] {
    return [
      {
        id: '1',
        name: 'React Tutorial Series',
        description: 'Complete React tutorial series from basics to advanced',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        contentItems: [],
        scheduledPosts: [],
        linkedFiles: [],
        linkedDrawings: []
      },
      {
        id: '2',
        name: 'Live Coding Streams',
        description: 'Weekly interactive coding sessions',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        contentItems: [],
        scheduledPosts: [],
        linkedFiles: [],
        linkedDrawings: []
      }
    ];
  }

  generateMockFiles(): ProjectCenterFile[] {
    return [
      {
        id: 'file-1',
        name: 'tutorial-ideas.csv',
        type: 'text/csv',
        size: 2048,
        uploadedAt: new Date().toISOString(),
        processed: true,
        extractedData: []
      }
    ];
  }

  generateMockDrawings(): ProjectCenterDrawing[] {
    return [
      {
        id: 'drawing-1',
        name: 'Tutorial Series Flowchart',
        createdAt: new Date().toISOString(),
        description: 'Visual progression of tutorial topics'
      }
    ];
  }
}

export default new ContentSchedulerService();