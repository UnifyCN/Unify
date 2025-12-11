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
      coverPhoto {
        _type,
        asset {
          _ref,
          _type
        },
        alt
      },
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
      coverPhoto {
        _type,
        asset {
          _ref,
          _type
        },
        alt
      },
      colorTheme { hex },
      icon,
      "submodules": *[_type == "submodule" && references(^._id)] | order(order) {
        _id,
        _type,
        title,
        description,
        module,
        intro_pages,
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
      coverPhoto {
        _type,
        asset {
          _ref,
          _type
        },
        alt
      },
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
      coverPhoto {
        _type,
        asset {
          _ref,
          _type
        },
        alt
      },
      colorTheme { hex },
      icon,
      "submodules": *[_type == "submodule" && references(^._id)] | order(order) {
        _id,
        _type,
        title,
        description,
        module,
        intro_pages,
        order,
        "lessons": *[_type == "lesson" && references(^._id)] | order(order) {
          _id,
          _type,
          title,
          slug,
          description,
          submodule,
          pages,
          activity_pages,
          order,
          "quizzes": *[_type == "quiz" && references(^._id)] | order(order_number) {
            _id,
            _type,
            title,
            description,
            lesson,
            order_number,
            questions
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
