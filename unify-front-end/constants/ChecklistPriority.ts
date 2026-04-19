import type { MaterialIcons } from '@expo/vector-icons';
import type { Priority } from '@/types/checklist';

export type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

export interface PriorityConfig {
  icon: MaterialIconName;
  color: string;
  backgroundColor: string;
  label: string;
}

export const PRIORITY_CONFIG: Record<Priority, PriorityConfig> = {
  'Do now': {
    icon: 'error-outline',
    color: '#E03B3B',
    backgroundColor: '#FBCFCF',
    label: 'Do now',
  },
  'Do soon': {
    icon: 'schedule',
    color: '#F47734',
    backgroundColor: '#FBE4CF',
    label: 'Do soon',
  },
  'Explore and connect': {
    icon: 'people',
    color: '#F49E34',
    backgroundColor: '#FFEDBD',
    label: 'Explore and connect',
  },
  'Explore & connect': {
    icon: 'people',
    color: '#F49E34',
    backgroundColor: '#FFEDBD',
    label: 'Explore and connect',
  },
  'Optional / later': {
    icon: 'pending',
    color: '#5E8651',
    backgroundColor: '#CDE9D2',
    label: 'Optional / later',
  },
};
