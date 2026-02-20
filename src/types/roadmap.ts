export interface RoadmapSkill {
  id: string;
  name: string;
  category: string;
  description: string;
  status: "not-started" | "in-progress" | "completed";
  progress: number; 
  projects?: string[];
  dateCompleted?: Date;
  priority: "low" | "medium" | "high";
  prerequisites?: string[];
}

export interface RoadmapCategory {
  id: string;
  name: string;
  description: string;
  skills: RoadmapSkill[];
  progress: number; 
  color: string;
}

export interface RoadmapData {
  userId: string;
  username: string;
  totalProgress: number;
  categories: RoadmapCategory[];
  lastUpdated: Date;
  completedSkills: number;
  totalSkills: number;
}

export interface ProgressUpdate {
  skillId: string;
  status: RoadmapSkill["status"];
  progress?: number;
  projects?: string[];
}
