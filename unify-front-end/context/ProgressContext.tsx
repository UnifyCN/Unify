import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { progressClient } from '@/services/progress/progressClient';

interface ProgressData {
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

interface ProgressContextType {
  progressData: ProgressData;
  isLoading: boolean;
  refreshProgress: () => Promise<void>;
  getSubmoduleProgress: (moduleId: string, submoduleId: string) => any;
}

const ProgressContext = createContext<ProgressContextType | undefined>(
  undefined
);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progressData, setProgressData] = useState<ProgressData>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllProgress = async () => {
    try {
      setIsLoading(true);
      const {
        data: { user },
      } = await progressClient.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Fetch all lesson progress
      const { data: lessonProgresses, error: lessonError } =
        await progressClient
          .from('user_lesson_progress')
          .select('*')
          .eq('user_id', user.id);

      if (lessonError) {
        console.error('Error fetching lesson progress:', lessonError);
        setIsLoading(false);
        return;
      }

      // Group lesson progress by module and submodule
      const groupedProgress: ProgressData = {};

      if (lessonProgresses) {
        lessonProgresses.forEach((lesson: any) => {
          const moduleId = lesson.sanity_module_id;
          const submoduleId = lesson.sanity_submodule_id;

          if (!groupedProgress[moduleId]) {
            groupedProgress[moduleId] = {};
          }

          if (!groupedProgress[moduleId][submoduleId]) {
            groupedProgress[moduleId][submoduleId] = {
              is_completed: false,
              progress_percent: 0,
              completed_lessons: 0,
              total_lessons: 0,
              last_updated: new Date().toISOString(),
            };
          }

          if (lesson.is_completed) {
            groupedProgress[moduleId][submoduleId].completed_lessons++;
          }
        });
      }

      // Calculate progress percentages
      Object.keys(groupedProgress).forEach(moduleId => {
        Object.keys(groupedProgress[moduleId]).forEach(submoduleId => {
          const submoduleData = groupedProgress[moduleId][submoduleId];
          // We'll need to get total lessons from Sanity data, but for now use completed lessons as total
          const totalLessons = Math.max(submoduleData.completed_lessons, 1);
          submoduleData.progress_percent = Math.round(
            (submoduleData.completed_lessons / totalLessons) * 100
          );
          submoduleData.is_completed =
            submoduleData.completed_lessons === totalLessons &&
            totalLessons > 0;
        });
      });

      setProgressData(groupedProgress);
      console.log('Progress data loaded:', groupedProgress);
    } catch (error) {
      console.error('Error fetching all progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProgress = async () => {
    await fetchAllProgress();
  };

  const getSubmoduleProgress = (moduleId: string, submoduleId: string) => {
    return (
      progressData[moduleId]?.[submoduleId] || {
        is_completed: false,
        progress_percent: 0,
        completed_lessons: 0,
        total_lessons: 0,
        last_updated: new Date().toISOString(),
      }
    );
  };

  useEffect(() => {
    fetchAllProgress();
  }, []);

  return (
    <ProgressContext.Provider
      value={{
        progressData,
        isLoading,
        refreshProgress,
        getSubmoduleProgress,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}
