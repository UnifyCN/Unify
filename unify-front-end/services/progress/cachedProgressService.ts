import { progressClient } from './progressClient';
import { sanityClient } from '@/sanity-custom';

interface CachedProgressData {
  [moduleId: string]: {
    [submoduleId: string]: {
      is_completed: boolean;
      progress_percent: number;
      completed_lessons: number;
      total_lessons: number;
      last_updated: string;
    };
  };
}

class CachedProgressService {
  private cache: CachedProgressData = {};
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getProgressData(forceRefresh = false): Promise<CachedProgressData> {
    const now = Date.now();

    // Return cached data if it's fresh and not forcing refresh
    if (
      !forceRefresh &&
      now - this.lastFetch < this.CACHE_DURATION &&
      Object.keys(this.cache).length > 0
    ) {
      console.log('Returning cached progress data');
      return this.cache;
    }

    try {
      console.log('Fetching fresh progress data...');
      const {
        data: { user },
      } = await progressClient.auth.getUser();
      if (!user) {
        return {};
      }

      // Fetch all lesson progress
      const { data: lessonProgresses, error: lessonError } =
        await progressClient
          .from('user_lesson_progress')
          .select('*')
          .eq('user_id', user.id);

      if (lessonError) {
        console.error('Error fetching lesson progress:', lessonError);
        return {};
      }

      // Fetch all modules with submodules and lessons from Sanity
      const sanityQuery = `*[_type == "module"] {
        _id,
        "submodules": *[_type == "submodule" && references(^._id)] | order(order) {
          _id,
          "lessons": *[_type == "lesson" && references(^._id)] | order(order) {
            _id
          }
        }
      }`;

      const modulesData = await sanityClient.fetch(sanityQuery);

      // Build progress data with actual lesson counts from Sanity
      const progressData: CachedProgressData = {};

      modulesData.forEach((module: any) => {
        progressData[module._id] = {};

        module.submodules.forEach((submodule: any) => {
          const totalLessons = submodule.lessons?.length || 0;
          const completedLessons =
            lessonProgresses?.filter(
              (lesson: any) =>
                lesson.sanity_submodule_id === submodule._id &&
                lesson.is_completed
            ).length || 0;

          const progressPercent =
            totalLessons > 0
              ? Math.round((completedLessons / totalLessons) * 100)
              : 0;
          const isCompleted =
            completedLessons === totalLessons && totalLessons > 0;

          progressData[module._id][submodule._id] = {
            is_completed: isCompleted,
            progress_percent: progressPercent,
            completed_lessons: completedLessons,
            total_lessons: totalLessons,
            last_updated: new Date().toISOString(),
          };
        });
      });

      this.cache = progressData;
      this.lastFetch = now;

      console.log('Progress data cached:', progressData);
      return progressData;
    } catch (error) {
      console.error('Error fetching progress data:', error);
      return this.cache; // Return stale cache on error
    }
  }

  async getSubmoduleProgress(moduleId: string, submoduleId: string) {
    const progressData = await this.getProgressData();
    return (
      progressData[moduleId]?.[submoduleId] || {
        is_completed: false,
        progress_percent: 0,
        completed_lessons: 0,
        total_lessons: 0,
        last_updated: new Date().toISOString(),
      }
    );
  }

  async refreshProgress() {
    return this.getProgressData(true);
  }

  // Call this when a lesson is completed to update the cache
  async updateProgressOnLessonCompletion(
    moduleId: string,
    submoduleId: string
  ) {
    console.log('Updating progress cache for lesson completion...');
    // Force refresh to get latest data
    return this.getProgressData(true);
  }
}

export const cachedProgressService = new CachedProgressService();
