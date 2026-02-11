import { sanityClient } from '../../sanity-custom';
import {
  SanityModule,
  SanitySubmoduleWithLessons,
  SanityModuleWithSubmodules,
} from '../../types/sanity';

// Get all modules
export async function getAllModules(): Promise<SanityModule[]> {
  try {
    const query = `*[_type == "module"] | order(title) {
      _id,
      _type,
      title,
      description,
      colorTheme { hex },
      icon
    }`;

    const modules = await sanityClient.fetch(query);
    return modules || [];
  } catch (error) {
    console.error('Error fetching modules from Sanity:', error);
    return [];
  }
}

// Get all modules with their submodules
export async function getAllModulesWithSubmodules(): Promise<
  SanityModuleWithSubmodules[]
> {
  try {
    const query = `*[_type == "module"] | order(title) {
      _id,
      _type,
      title,
      description,
      colorTheme { hex },
      icon,
      "submodules": *[_type == "submodule" && references(^._id)] | order(order) {
        _id,
        _type,
        title,
        description,
        module,
        order
      }
    }`;

    const modules = await sanityClient.fetch(query);
    return modules || [];
  } catch (error) {
    console.error('Error fetching modules with submodules from Sanity:', error);
    return [];
  }
}

// Get a single module by ID
export async function getModule(
  moduleId: string
): Promise<SanityModule | null> {
  try {
    const query = `*[_type == "module" && _id == $moduleId][0] {
      _id,
      _type,
      title,
      description,
      colorTheme { hex },
      icon
    }`;

    const module = await sanityClient.fetch(query, { moduleId });
    return module || null;
  } catch (error) {
    console.error('Error fetching module from Sanity:', error);
    return null;
  }
}

// Get module with all its submodules
export async function getModuleWithSubmodules(
  moduleId: string
): Promise<
  (SanityModule & { submodules: SanitySubmoduleWithLessons[] }) | null
> {
  try {
    const query = `*[_type == "module" && _id == $moduleId][0] {
      _id,
      _type,
      title,
      description,
      colorTheme { hex },
      icon,
      "submodules": *[_type == "submodule" && references(^._id)] | order(order) {
        _id,
        _type,
        title,
        description,
        module,
        order,
        "lessons": *[_type == "lesson" && references(^._id)] | order(order) {
          _id,
          _type,
          title,
          slug,
          description,
          submodule,
          order,
          "lesson_page_count": count(pages),
          "activity_page_count": count(activity_pages),
          "ending_page_count": count(ending_pages),
          "quizzes": *[_type == "quiz" && references(^._id)] | order(order_number) {
            _id,
            _type,
            title,
            order_number,
            "question_count": count(questions)
          }
        }
      }
    }`;

    const module = await sanityClient.fetch(query, { moduleId });
    return module || null;
  } catch (error) {
    console.error('Error fetching module with submodules from Sanity:', error);
    return null;
  }
}
