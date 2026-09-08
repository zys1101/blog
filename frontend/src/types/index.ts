export interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  demoUrl: string;
  githubUrl: string;
  cover: string;
  featured: boolean;
  background?: string;
  highlights?: string[];
  challenges?: string;
  outcome?: string;
}

export interface Post {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  contentHtml?: string; // 或 content: string
}

export interface Experience {
  role: string;
  company: string;
  date: string;
  points: string[];
}

export interface Education {
  degree: string;
  school: string;
  date: string;
}

export interface SkillCategory {
  title: string;
  items: string[];
}