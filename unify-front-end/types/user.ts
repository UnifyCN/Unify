import { SvgProps } from 'react-native-svg';

export type User = {
  // TODO: I feel like this is not right, update after speaking with team
  id: number;
  username: string;
  name: string;
  headshot?: React.FC<SvgProps>;
};
