export type LearnGuideMeta = {
  slug: string;
  title: string;
  summary: string;
  readingMinutes: number;
  tags: string[];
  order: number;
};

export type LearnGuide = LearnGuideMeta & {
  body: string;
};
