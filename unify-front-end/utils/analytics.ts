import { useMemo } from 'react';
import { usePostHog } from 'posthog-react-native';

// Event name constants for type safety and consistency
export const AnalyticsEvents = {
  // Screen views
  SCREEN_VIEWED: 'screen_viewed',

  // Tab navigation
  TAB_SWITCHED: 'tab_switched',

  // Posts
  POST_LIKED: 'post_liked',
  POST_UNLIKED: 'post_unliked',
  POST_SAVED: 'post_saved',
  POST_UNSAVED: 'post_unsaved',
  POST_COMMENT_OPENED: 'post_comment_opened',
  POST_CREATED: 'post_created',

  // Groups
  GROUP_JOINED: 'group_joined',
  GROUP_LEFT: 'group_left',
  GROUP_VIEWED: 'group_viewed',

  // Events
  EVENT_VIEWED: 'event_viewed',
  EVENT_SHARED: 'event_shared',
  EVENT_EXTERNAL_LINK_CLICKED: 'event_external_link_clicked',

  // AI Companion
  COMPANION_MESSAGE_SENT: 'companion_message_sent',
  COMPANION_STARTER_PROMPT_USED: 'companion_starter_prompt_used',
  COMPANION_SUGGESTION_CLICKED: 'companion_suggestion_clicked',
  COMPANION_HISTORY_VIEWED: 'companion_history_viewed',

  // Learning
  MODULE_VIEWED: 'module_viewed',
  SUBMODULE_STARTED: 'submodule_started',
  LESSON_PAGE_VIEWED: 'lesson_page_viewed',
  LESSON_COMPLETED: 'lesson_completed',

  // Learn - Text Selection & Highlights
  LESSON_TEXT_SELECTED: 'lesson_text_selected',
  LESSON_HIGHLIGHT_CREATED: 'lesson_highlight_created',
  LESSON_HIGHLIGHT_REMOVED: 'lesson_highlight_removed',
  LESSON_ASK_AI_USED: 'lesson_ask_ai_used',
  LESSON_ASK_AI_RETRY: 'lesson_ask_ai_retry',

  // Auth
  SIGN_UP_STARTED: 'sign_up_started',
  SIGN_UP_COMPLETED: 'sign_up_completed',
  SIGN_UP_FAILED: 'sign_up_failed',
  SIGN_IN_COMPLETED: 'sign_in_completed',
  SIGN_IN_FAILED: 'sign_in_failed',
  GOOGLE_SIGN_IN_USED: 'google_sign_in_used',
  APPLE_SIGN_IN_USED: 'apple_sign_in_used',

  // Search
  SEARCH_OPENED: 'search_opened',
  SEARCH_QUERY_SUBMITTED: 'search_query_submitted',

  // Feed
  FEED_TAB_SWITCHED: 'feed_tab_switched',

  // New Learning Events
  MODULE_CARD_CLICKED: 'module_card_clicked',
  SUBMODULE_VIEWED: 'submodule_viewed',
  LESSON_STARTED: 'lesson_started',
  QUIZ_CARD_CLICKED: 'quiz_card_clicked',
  QUIZ_COMPLETED: 'quiz_completed',
  ACTIVITY_COMPLETED: 'activity_completed',

  // Checklist
  CHECKLIST_TASK_COMPLETED: 'checklist_task_completed',
  CHECKLIST_TASK_UNCOMPLETED: 'checklist_task_uncompleted',
  CHECKLIST_CUSTOM_TASK_CREATED: 'checklist_custom_task_created',
  CHECKLIST_CUSTOM_TASK_DELETED: 'checklist_custom_task_deleted',

  // Reports
  REPORT_SUBMITTED: 'report_submitted',

  // Onboarding
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  ONBOARDING_COMPLETED: 'onboarding_completed',

  // Notifications
  NOTIFICATION_OPENED: 'notification_opened',
  NOTIFICATIONS_MARK_ALL_READ: 'notifications_mark_all_read',

  // AI Companion (extended)
  COMPANION_RESPONSE_RECEIVED: 'companion_response_received',
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

// Event property types for type safety
export interface TabSwitchProperties {
  from_tab: string;
  to_tab: string;
}

export interface PostEventProperties {
  post_id: string;
}

export interface GroupEventProperties {
  group_id: string;
  group_name?: string;
}

export interface EventEventProperties {
  event_id: string;
  event_title?: string;
}

export interface CompanionMessageProperties {
  message_length: number;
}

export interface CompanionPromptProperties {
  prompt: string;
  mode?: string;
}

export interface LessonProperties {
  module_id: string;
  submodule_id?: string;
  lesson_id?: string;
  page_number?: number;
  total_pages?: number;
}

export interface AuthErrorProperties {
  error_type: string;
}

export interface GoogleSignInProperties {
  auth_type: 'sign_up' | 'sign_in';
}

export interface AppleSignInProperties {
  auth_type: 'sign_up' | 'sign_in';
}

export interface FeedTabProperties {
  tab_name: 'For You' | 'Following' | 'Groups';
}

export interface ChecklistTaskProperties {
  task_title: string;
  task_priority: string;
  source: 'sanity' | 'custom';
}

export interface ReportProperties {
  report_type: 'post' | 'user';
}

export interface OnboardingStepProperties {
  step_number: number;
  step_name: string;
}

export interface NotificationProperties {
  notification_type: string;
}

export interface CompanionResponseProperties {
  query_type: string;
  has_sources: boolean;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  estimated_cost_usd?: number;
  response_time_ms?: number;
}

// Hook for analytics tracking
export function useAnalytics() {
  const posthog = usePostHog();

  return useMemo(
    () => ({
      // Screen tracking
      trackScreen: (screenName: string) => {
        posthog?.screen(screenName);
      },

      // Tab navigation
      trackTabSwitch: (fromTab: string, toTab: string) => {
        posthog?.capture(AnalyticsEvents.TAB_SWITCHED, {
          from_tab: fromTab,
          to_tab: toTab,
        });
      },

      // Post interactions
      trackPostLike: (postId: string) => {
        posthog?.capture(AnalyticsEvents.POST_LIKED, { post_id: postId });
      },
      trackPostUnlike: (postId: string) => {
        posthog?.capture(AnalyticsEvents.POST_UNLIKED, { post_id: postId });
      },
      trackPostSave: (postId: string) => {
        posthog?.capture(AnalyticsEvents.POST_SAVED, { post_id: postId });
      },
      trackPostUnsave: (postId: string) => {
        posthog?.capture(AnalyticsEvents.POST_UNSAVED, { post_id: postId });
      },
      trackPostCommentOpened: (postId: string) => {
        posthog?.capture(AnalyticsEvents.POST_COMMENT_OPENED, {
          post_id: postId,
        });
      },
      trackPostCreated: (postId: string) => {
        posthog?.capture(AnalyticsEvents.POST_CREATED, { post_id: postId });
      },

      // Group interactions
      trackGroupViewed: (groupId: string, groupName?: string) => {
        posthog?.capture(AnalyticsEvents.GROUP_VIEWED, {
          group_id: groupId,
          ...(groupName && { group_name: groupName }),
        });
      },
      trackGroupJoined: (groupId: string, groupName?: string) => {
        posthog?.capture(AnalyticsEvents.GROUP_JOINED, {
          group_id: groupId,
          ...(groupName && { group_name: groupName }),
        });
      },
      trackGroupLeft: (groupId: string, groupName?: string) => {
        posthog?.capture(AnalyticsEvents.GROUP_LEFT, {
          group_id: groupId,
          ...(groupName && { group_name: groupName }),
        });
      },

      // Event interactions
      trackEventViewed: (eventId: string, eventTitle?: string) => {
        posthog?.capture(AnalyticsEvents.EVENT_VIEWED, {
          event_id: eventId,
          ...(eventTitle && { event_title: eventTitle }),
        });
      },
      trackEventShared: (eventId: string, eventTitle?: string) => {
        posthog?.capture(AnalyticsEvents.EVENT_SHARED, {
          event_id: eventId,
          ...(eventTitle && { event_title: eventTitle }),
        });
      },
      trackEventExternalLinkClicked: (eventId: string, eventTitle?: string) => {
        posthog?.capture(AnalyticsEvents.EVENT_EXTERNAL_LINK_CLICKED, {
          event_id: eventId,
          ...(eventTitle && { event_title: eventTitle }),
        });
      },

      // AI Companion
      trackCompanionMessageSent: (messageLength: number) => {
        posthog?.capture(AnalyticsEvents.COMPANION_MESSAGE_SENT, {
          message_length: messageLength,
        });
      },
      trackCompanionStarterPromptUsed: (prompt: string, mode?: string) => {
        posthog?.capture(AnalyticsEvents.COMPANION_STARTER_PROMPT_USED, {
          prompt,
          ...(mode && { mode }),
        });
      },
      trackCompanionSuggestionClicked: (suggestion: string) => {
        posthog?.capture(AnalyticsEvents.COMPANION_SUGGESTION_CLICKED, {
          suggestion,
        });
      },
      trackCompanionHistoryViewed: () => {
        posthog?.capture(AnalyticsEvents.COMPANION_HISTORY_VIEWED);
      },

      // Learning
      trackModuleViewed: (
        moduleId: string,
        moduleTitle?: string,
        submoduleCount?: number
      ) => {
        posthog?.capture(AnalyticsEvents.MODULE_VIEWED, {
          module_id: moduleId,
          ...(moduleTitle && { module_title: moduleTitle }),
          ...(submoduleCount !== undefined && {
            submodule_count: submoduleCount,
          }),
        });
      },
      trackSubmoduleStarted: (moduleId: string, submoduleId: string) => {
        posthog?.capture(AnalyticsEvents.SUBMODULE_STARTED, {
          module_id: moduleId,
          submodule_id: submoduleId,
        });
      },
      trackLessonPageViewed: (
        moduleId: string,
        submoduleId: string,
        lessonId: string,
        pageNumber: number,
        totalPages: number
      ) => {
        posthog?.capture(AnalyticsEvents.LESSON_PAGE_VIEWED, {
          module_id: moduleId,
          submodule_id: submoduleId,
          lesson_id: lessonId,
          page_number: pageNumber,
          total_pages: totalPages,
        });
      },
      trackLessonCompleted: (
        moduleId: string,
        submoduleId: string,
        lessonId: string
      ) => {
        posthog?.capture(AnalyticsEvents.LESSON_COMPLETED, {
          module_id: moduleId,
          submodule_id: submoduleId,
          lesson_id: lessonId,
        });
      },

      // New Learning
      trackModuleCardClicked: (moduleId: string, moduleTitle: string) => {
        posthog?.capture(AnalyticsEvents.MODULE_CARD_CLICKED, {
          module_id: moduleId,
          module_title: moduleTitle,
        });
      },
      trackSubmoduleViewed: (
        moduleId: string,
        submoduleId: string,
        submoduleTitle?: string
      ) => {
        posthog?.capture(AnalyticsEvents.SUBMODULE_VIEWED, {
          module_id: moduleId,
          submodule_id: submoduleId,
          ...(submoduleTitle && { submodule_title: submoduleTitle }),
        });
      },
      trackLessonStarted: (
        moduleId: string,
        submoduleId: string,
        lessonId: string,
        lessonTitle?: string
      ) => {
        posthog?.capture(AnalyticsEvents.LESSON_STARTED, {
          module_id: moduleId,
          submodule_id: submoduleId,
          lesson_id: lessonId,
          ...(lessonTitle && { lesson_title: lessonTitle }),
        });
      },
      trackActivityCompleted: (
        moduleId: string,
        submoduleId: string,
        lessonId: string,
        activityId: string
      ) => {
        posthog?.capture(AnalyticsEvents.ACTIVITY_COMPLETED, {
          module_id: moduleId,
          submodule_id: submoduleId,
          lesson_id: lessonId,
          activity_id: activityId,
        });
      },

      // Auth
      trackSignUpStarted: () => {
        posthog?.capture(AnalyticsEvents.SIGN_UP_STARTED);
      },
      trackSignUpCompleted: () => {
        posthog?.capture(AnalyticsEvents.SIGN_UP_COMPLETED);
      },
      trackSignUpFailed: (errorType: string) => {
        posthog?.capture(AnalyticsEvents.SIGN_UP_FAILED, {
          error_type: errorType,
        });
      },
      trackSignInCompleted: () => {
        posthog?.capture(AnalyticsEvents.SIGN_IN_COMPLETED);
      },
      trackSignInFailed: (errorType: string) => {
        posthog?.capture(AnalyticsEvents.SIGN_IN_FAILED, {
          error_type: errorType,
        });
      },
      trackGoogleSignInUsed: (authType: 'sign_up' | 'sign_in') => {
        posthog?.capture(AnalyticsEvents.GOOGLE_SIGN_IN_USED, {
          auth_type: authType,
        });
      },
      trackAppleSignInUsed: (authType: 'sign_up' | 'sign_in') => {
        posthog?.capture(AnalyticsEvents.APPLE_SIGN_IN_USED, {
          auth_type: authType,
        });
      },

      // Search
      trackSearchOpened: () => {
        posthog?.capture(AnalyticsEvents.SEARCH_OPENED);
      },
      trackSearchQuerySubmitted: (query: string) => {
        posthog?.capture(AnalyticsEvents.SEARCH_QUERY_SUBMITTED, { query });
      },

      // Feed
      trackFeedTabSwitched: (tabName: 'For You' | 'Following' | 'Groups') => {
        posthog?.capture(AnalyticsEvents.FEED_TAB_SWITCHED, {
          tab_name: tabName,
        });
      },

      // Checklist
      trackChecklistTaskCompleted: (
        taskTitle: string,
        taskPriority: string,
        source: 'sanity' | 'custom'
      ) => {
        posthog?.capture(AnalyticsEvents.CHECKLIST_TASK_COMPLETED, {
          task_title: taskTitle,
          task_priority: taskPriority,
          source,
        });
      },
      trackChecklistTaskUncompleted: (
        taskTitle: string,
        taskPriority: string,
        source: 'sanity' | 'custom'
      ) => {
        posthog?.capture(AnalyticsEvents.CHECKLIST_TASK_UNCOMPLETED, {
          task_title: taskTitle,
          task_priority: taskPriority,
          source,
        });
      },
      trackChecklistCustomTaskCreated: () => {
        posthog?.capture(AnalyticsEvents.CHECKLIST_CUSTOM_TASK_CREATED);
      },
      trackChecklistCustomTaskDeleted: () => {
        posthog?.capture(AnalyticsEvents.CHECKLIST_CUSTOM_TASK_DELETED);
      },

      // Reports
      trackReportSubmitted: (reportType: 'post' | 'user') => {
        posthog?.capture(AnalyticsEvents.REPORT_SUBMITTED, {
          report_type: reportType,
        });
      },

      // Onboarding
      trackOnboardingStepCompleted: (stepNumber: number, stepName: string) => {
        posthog?.capture(AnalyticsEvents.ONBOARDING_STEP_COMPLETED, {
          step_number: stepNumber,
          step_name: stepName,
        });
      },
      trackOnboardingCompleted: (persona: string | null) => {
        posthog?.capture(AnalyticsEvents.ONBOARDING_COMPLETED, {
          ...(persona && { persona }),
        });
      },

      // Notifications
      trackNotificationOpened: (notificationType: string) => {
        posthog?.capture(AnalyticsEvents.NOTIFICATION_OPENED, {
          notification_type: notificationType,
        });
      },
      trackNotificationsMarkAllRead: (count: number) => {
        posthog?.capture(AnalyticsEvents.NOTIFICATIONS_MARK_ALL_READ, {
          count,
        });
      },

      // Learn - Text Selection & Highlights
      trackLessonTextSelected: (lessonId: string, selectedText: string) => {
        posthog?.capture(AnalyticsEvents.LESSON_TEXT_SELECTED, {
          lesson_id: lessonId,
          text_length: selectedText.length,
          word_count: selectedText.split(/\s+/).length,
        });
      },
      trackLessonHighlightCreated: (lessonId: string, selectedText: string) => {
        posthog?.capture(AnalyticsEvents.LESSON_HIGHLIGHT_CREATED, {
          lesson_id: lessonId,
          text_length: selectedText.length,
        });
      },
      trackLessonHighlightRemoved: (lessonId: string) => {
        posthog?.capture(AnalyticsEvents.LESSON_HIGHLIGHT_REMOVED, {
          lesson_id: lessonId,
        });
      },
      trackLessonAskAiUsed: (lessonId: string, term: string) => {
        posthog?.capture(AnalyticsEvents.LESSON_ASK_AI_USED, {
          lesson_id: lessonId,
          term_length: term.length,
        });
      },
      trackLessonAskAiRetry: (lessonId: string) => {
        posthog?.capture(AnalyticsEvents.LESSON_ASK_AI_RETRY, {
          lesson_id: lessonId,
        });
      },

      // AI Companion (extended)
      trackCompanionResponseReceived: (
        properties: CompanionResponseProperties
      ) => {
        posthog?.capture(
          AnalyticsEvents.COMPANION_RESPONSE_RECEIVED,
          { ...properties }
        );
      },

      // Generic event capture
      capture: (
        eventName: AnalyticsEventName,
        properties?: Record<string, any>
      ) => {
        posthog?.capture(eventName, properties);
      },
    }),
    [posthog]
  );
}
