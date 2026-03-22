import Dexie, { type Table } from "dexie";

export type TaskItem = {
  id: string;
  title: string;
  done: boolean;
};

export type PlanRecord = {
  id: string;
  title: string;
  location: string;
  /** ISO date (yyyy-mm-dd) — used for countdown */
  targetDate: string;
  tasks: TaskItem[];
};

export type ScheduleEventRecord = {
  id: string;
  planId: string;
  /** ISO date */
  day: string;
  startMinutes: number;
  endMinutes: number;
  title: string;
  categoryColor: string;
};

export type DiaryRecord = {
  id: string;
  planId: string;
  content: string;
  updatedAt: number;
};

export type StrategyRecord = {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
};

/** Chunk for RAG — vector stored as number[] for IndexedDB */
export type StrategyChunkRecord = {
  id: string;
  strategyId: string;
  text: string;
  vector: number[];
};

export class TourTalkDB extends Dexie {
  plans!: Table<PlanRecord, string>;
  scheduleEvents!: Table<ScheduleEventRecord, string>;
  diaries!: Table<DiaryRecord, string>;
  strategies!: Table<StrategyRecord, string>;
  strategyChunks!: Table<StrategyChunkRecord, string>;

  constructor() {
    super("tour_talk_db_v1");
    this.version(1).stores({
      plans: "id, targetDate, location",
      scheduleEvents: "id, planId, day",
      diaries: "id, planId, updatedAt",
      strategies: "id, updatedAt, title",
      strategyChunks: "id, strategyId",
    });
  }
}

export const db = new TourTalkDB();
