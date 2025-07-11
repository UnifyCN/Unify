import { SvgProps } from "react-native-svg";

export type OnboardingStep = {
  graphic: React.FC<SvgProps>;
  title: string;
  description: string;
  stepNumber: number;
};