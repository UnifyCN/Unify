import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { progressClient } from '@/services/progress/progressClient';
import { sanityClient } from '@/sanity-custom';

interface ContinueLesson {
  id: string;
  title: string;
  description: string;
  moduleId: string;
  moduleTitle: string;
  submoduleId: string;
  submoduleTitle: string;
  currentPage: number;
  totalPages: number;
  progressPercent: number;
  currentSection: number;
  totalSections: number;
  href: string;
}

export function useInProgressLessons() {
  const [lessons, setLessons] = useState<ContinueLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInProgressLessons = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const {
        data: { user },
      } = await progressClient.auth.getUser();
      if (!user) {
        setLessons([]);
        setIsLoading(false);
        return;
      }

      // Fetch all lesson progress
      const { data: lessonProgresses, error: lessonError } =
        await progressClient
          .from('user_lesson_progress')
          .select('*')
          .eq('user_id', user.id)
          .order('last_accessed_at', { ascending: false });

      if (lessonError) {
        console.error('Error fetching lesson progress:', lessonError);
        setError('Failed to fetch lessons');
        setIsLoading(false);
        return;
      }

      // Fetch all modules with submodules and lessons
      const modulesQuery = `*[_type == "module"] {
          _id,
          title,
          "submodules": *[_type == "submodule" && references(^._id)] | order(order) {
            _id,
            title,
            order,
            "lessons": *[_type == "lesson" && references(^._id)] | order(order) {
              _id,
              title,
              description,
              order,
              pages,
              activity_pages,
              "quizzes": *[_type == "quiz" && references(^._id)]
            }
          }
        }`;

      const modulesData = await sanityClient.fetch(modulesQuery);

      // Find active lessons using the same logic as submodule map
      const availableLessons: ContinueLesson[] = [];

      for (const module of modulesData) {
        // Find the first active lesson in this module
        let activeLesson = null;
        let activeSubmodule = null;

        for (const submodule of module.submodules) {
          // Get lesson progress for this submodule
          const submoduleLessons =
            lessonProgresses?.filter(
              p => p.sanity_submodule_id === submodule._id
            ) || [];

          // Find the first active lesson in this submodule using the same logic as map
          for (let i = 0; i < submodule.lessons.length; i++) {
            const lesson = submodule.lessons[i];
            const lessonProgress = submoduleLessons.find(
              p => p.sanity_lesson_id === lesson._id
            );

            const isCompleted = lessonProgress?.is_completed || false;
            const isInProgress = lessonProgress?.is_in_progress || false;

            // Determine if lesson is active (same logic as submodule map)
            let isActive = false;
            if (isInProgress) {
              isActive = true; // Currently in progress
            } else if (i === 0) {
              isActive = true; // First lesson is always active
            } else {
              // Check if previous lesson is completed
              const previousLesson = submodule.lessons[i - 1];
              const previousProgress = submoduleLessons.find(
                p => p.sanity_lesson_id === previousLesson._id
              );
              const previousCompleted = previousProgress?.is_completed || false;
              isActive = previousCompleted; // Active if previous is completed
            }

            // If this lesson is active, use it
            if (isActive && !isCompleted) {
              activeLesson = lesson;
              activeSubmodule = submodule;
              break;
            }
          }

          // If we found an active lesson, break out of submodule loop
          if (activeLesson) {
            break;
          }
        }

        // If we found an active lesson in this module, add it
        if (activeLesson && activeSubmodule) {
          const lessonProgress = lessonProgresses?.find(
            p => p.sanity_lesson_id === activeLesson._id
          );

          // Calculate total pages
          const totalPages =
            (activeLesson.pages?.length || 0) +
            (activeLesson.activity_pages?.length || 0) +
            (activeLesson.quizzes?.length || 0);

          const progressPercent =
            lessonProgress && totalPages > 0
              ? Math.round((lessonProgress.completed_pages / totalPages) * 100)
              : 0;

          const currentPage = lessonProgress?.current_page_number || 1;

          // Calculate section (submodule) number and total sections
          const submoduleIndex = module.submodules.findIndex(
            (s: any) => s._id === activeSubmodule._id
          );
          const currentSection = submoduleIndex >= 0 ? submoduleIndex + 1 : 1;
          const totalSections = module.submodules?.length || 0;

          availableLessons.push({
            id: activeLesson._id,
            title: activeLesson.title || 'Untitled Lesson',
            description: activeLesson.description || '',
            moduleId: module._id,
            moduleTitle: module.title || 'Unknown Module',
            submoduleId: activeSubmodule._id,
            submoduleTitle: activeSubmodule.title || 'Unknown Submodule',
            currentPage: currentPage,
            totalPages: totalPages,
            progressPercent: progressPercent,
            currentSection: currentSection,
            totalSections: totalSections,
            href: `/(tabs)/Learn/modules/${module._id}/${activeSubmodule._id}/lessons/${activeLesson._id}/pages/${currentPage}` as any,
          });
        }
      }

      // Sort by most recently accessed
      const inProgressLessons = availableLessons.sort((a, b) => {
        const aProgress = lessonProgresses.find(
          p => p.sanity_lesson_id === a.id
        );
        const bProgress = lessonProgresses.find(
          p => p.sanity_lesson_id === b.id
        );

        if (aProgress && bProgress) {
          return (
            new Date(bProgress.last_accessed_at).getTime() -
            new Date(aProgress.last_accessed_at).getTime()
          );
        }
        return 0;
      });

      setLessons(inProgressLessons);
    } catch (error) {
      console.error('Error fetching in-progress lessons:', error);
      setError('Failed to load lessons');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchInProgressLessons();
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchInProgressLessons();
    }, [])
  );

  return {
    lessons,
    isLoading,
    error,
    refresh: fetchInProgressLessons,
  };
}
