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
      return this.cache;
    }

    try {
      let user = null;
      try {
        const sessionResult = await progressClient.auth.getSession();
        user = sessionResult?.data?.session?.user || null;
        if (sessionResult?.error) {
          console.error(
            'Error getting session in cachedProgressService:',
            sessionResult.error
          );
          return this.cache; // Return stale cache on auth error
        }
      } catch (authError: any) {
        console.error(
          'Exception getting session in cachedProgressService:',
          authError
        );
        return this.cache; // Return stale cache on auth error
      }

      if (!user) {
        return {};
      }

      // Fetch all lesson progress
      let lessonProgresses = null;
      let lessonError = null;

      try {
        const progressResult = await progressClient
          .from('user_lesson_progress')
          .select('*')
          .eq('user_id', user.id);

        lessonProgresses = progressResult?.data || null;
        lessonError = progressResult?.error || null;
      } catch (queryError: any) {
        console.error('Exception fetching lesson progress:', queryError);
        lessonError = queryError;
        return this.cache; // Return stale cache on query error
      }

      if (lessonError) {
        console.error('Error fetching lesson progress:', lessonError);
        return this.cache; // Return stale cache on error
      }

      // Fetch all modules with submodules and lessons from Sanity
      let modulesData = null;
      try {
        const sanityQuery = `*[_type == "module"] {
          _id,
          "submodules": *[_type == "submodule" && references(^._id)] | order(order) {
            _id,
            "lessons": *[_type == "lesson" && references(^._id)] | order(order) {
              _id
            }
          }
        }`;

        modulesData = await sanityClient.fetch(sanityQuery);
      } catch (sanityError: any) {
        console.error('Error fetching from Sanity:', sanityError);
        return this.cache; // Return stale cache on Sanity error
      }

      if (!modulesData || !Array.isArray(modulesData)) {
        console.error('Invalid Sanity data returned');
        return this.cache;
      }

      // Build progress data with actual lesson counts from Sanity
      const progressData: CachedProgressData = {};

      if (!Array.isArray(modulesData)) {
        console.error('Sanity returned non-array data');
        return this.cache;
      }

      modulesData.forEach((module: any) => {
        if (!module?._id) return;
        progressData[module._id] = {};

        if (!Array.isArray(module.submodules)) return;

        module.submodules.forEach((submodule: any) => {
          if (!submodule?._id) return;
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

      return progressData;
    } catch (error) {
      console.error('Error fetching progress data:', error);
      return this.cache; // Return stale cache on error
    }
  }

  async getSubmoduleProgress(moduleId: string, submoduleId: string) {
    try {
      if (!moduleId || !submoduleId) {
        return {
          is_completed: false,
          progress_percent: 0,
          completed_lessons: 0,
          total_lessons: 0,
          last_updated: new Date().toISOString(),
        };
      }

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
    } catch (error: any) {
      console.error('Error in getSubmoduleProgress:', error);
      return {
        is_completed: false,
        progress_percent: 0,
        completed_lessons: 0,
        total_lessons: 0,
        last_updated: new Date().toISOString(),
      };
    }
  }

  async refreshProgress() {
    return this.getProgressData(true);
  }

  // Call this when a lesson is completed to update the cache
  async updateProgressOnLessonCompletion(
    moduleId: string,
    submoduleId: string
  ) {
    // Force refresh to get latest data
    return this.getProgressData(true);
  }
}

export const cachedProgressService = new CachedProgressService();
