# Progress Tracking Implementation Guide

## 🎯 Overview

This schema tracks user progress across your Sanity CMS content structure with the following capabilities:

### **📊 What It Tracks:**

1. **Last Page Position**: Exact page user was on (lesson, activity, quiz, question)
2. **Lesson Progress**: How many pages completed within a lesson
3. **Submodule Progress**: How many pages completed within a submodule
4. **Module Progress**: How many pages completed within a module + submodule completion count

### **🏗️ Schema Structure:**

```
Module (1) → Submodule (N) → Lesson (N) → Pages (N)
                                    ↓
                              Activity Pages (N)
                                    ↓
                              Quiz Pages (N)
                                    ↓
                              Quiz Questions (N)
```

## 📋 **Key Features:**

### **1. Hierarchical Progress Tracking**
- **Module Level**: Tracks total pages + completed submodules
- **Submodule Level**: Tracks total pages + completed lessons  
- **Lesson Level**: Tracks total pages + current position
- **Page Level**: Tracks individual page visits and completions

### **2. Current Position Tracking**
- `current_page_type`: 'intro', 'lesson', 'activity', 'quiz'
- `current_page_number`: Which page number
- `current_quiz_id`: Current quiz being taken
- `current_question_number`: Current quiz question

### **3. Sequential Unlocking**
- Lessons unlock based on previous lesson completion
- Submodules unlock based on previous submodule completion
- Modules unlock based on previous module completion

### **4. Detailed Analytics**
- Time spent per page
- Quiz scores and attempts
- Activity input tracking
- Retake tracking

## 🚀 **Implementation Steps:**

### **Step 1: Database Setup**
```sql
-- Run the progress_tracking_schema.sql file in your Supabase SQL editor
-- This creates all tables, indexes, RLS policies, and helper functions
```

### **Step 2: TypeScript Integration**
```typescript
// Import the types from types/progress.ts
import { 
  UserLessonProgress, 
  ProgressTrackingState, 
  ProgressTrackingActions 
} from '@/types/progress';
```

### **Step 3: Progress Tracking Hooks**
Create hooks for:
- `useLessonProgress(lessonId)` - Track lesson progress
- `useSubmoduleProgress(submoduleId)` - Track submodule progress  
- `useModuleProgress(moduleId)` - Track module progress
- `useProgressTracking()` - Global progress state

### **Step 4: Page-Level Integration**
Update your page components:
- **Lesson Pages**: Track page visits and completions
- **Activity Pages**: Track input submissions
- **Quiz Pages**: Track question responses and scores
- **Navigation**: Update progress on page changes

### **Step 5: Progress Display**
Update your map components:
- **Module Map**: Show module progress and submodule completion
- **Submodule Map**: Show lesson progress and completion status
- **Lesson Map**: Show page progress and current position

## 🔧 **Key Implementation Points:**

### **1. Progress Calculation**
```typescript
// Calculate lesson progress
const lessonProgress = (completedPages / totalPages) * 100;

// Calculate submodule progress  
const submoduleProgress = (completedPages / totalPages) * 100;

// Calculate module progress
const moduleProgress = (completedPages / totalPages) * 100;
```

### **2. Sequential Unlocking Logic**
```typescript
// Check if lesson can be accessed
const canAccessLesson = (lessonId: string) => {
  // Check if previous lesson is completed
  // Check if current lesson is unlocked
  // Return boolean
};
```

### **3. Progress Updates**
```typescript
// Update progress when page is completed
const updateProgress = async (lessonId: string, pageType: string, pageKey: string) => {
  // Mark page as completed
  // Update lesson progress
  // Update submodule progress  
  // Update module progress
  // Check for completions
};
```

### **4. Current Position Tracking**
```typescript
// Track current position
const trackCurrentPosition = (lessonId: string, pageType: string, pageNumber: number) => {
  // Update current_page_type
  // Update current_page_number
  // Update last_accessed_at
};
```

## 📱 **Integration with Your App:**

### **1. Lesson Pages** (`pages/[pageNum].tsx`)
- Track page visits on mount
- Update progress on navigation
- Mark pages as completed

### **2. Activity Pages** (`activities/[pageNum].tsx`)
- Track input submissions
- Update progress on completion
- Save activity inputs

### **3. Quiz Pages** (`quizzes/[questionNum].tsx`)
- Track quiz attempts
- Save question responses
- Update scores on completion

### **4. Map Components** (`map.tsx`)
- Display progress indicators
- Show completion status
- Enable/disable navigation based on progress

## 🎨 **Visual Progress Indicators:**

### **Module Level:**
- Progress bar showing overall completion
- Submodule completion indicators
- Next available submodule highlighting

### **Submodule Level:**
- Lesson completion circles
- Progress percentages
- Current lesson highlighting

### **Lesson Level:**
- Page progress indicators
- Current page highlighting
- Completion status

## 🔄 **Data Flow:**

```
User Action → Page Component → Progress Hook → Database Update → UI Update
```

1. **User visits page** → Track page visit
2. **User completes page** → Update progress
3. **User completes lesson** → Update lesson progress
4. **User completes submodule** → Update submodule progress
5. **User completes module** → Update module progress

## 🚀 **Next Steps:**

1. **Run the SQL schema** in your Supabase database
2. **Create the TypeScript types** from the provided file
3. **Implement progress tracking hooks** for each level
4. **Update page components** to track progress
5. **Update map components** to display progress
6. **Test the complete flow** from module to lesson completion

This schema provides a robust foundation for tracking user progress across your entire learning platform! 🎯


