import OnboardingOne from '../../assets/images/onboardingSvgOne.svg';
import OnboardingTwo from '../../assets/images/onboardingSvgTwo.svg';
import OnboardingThree from '../../assets/images/onboardingSvgThree.svg';
import { OnboardingStep } from '../../types/onboarding';

const onboardingSteps: OnboardingStep[] = [
  {
    graphic: OnboardingOne,
    title: 'Fostering Community',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut.',
    stepNumber: 1,
  },
  {
    graphic: OnboardingTwo,
    title: 'Empowering Learning',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut.',
    stepNumber: 2,
  },
  {
    graphic: OnboardingThree,
    title: 'Providing Resources',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut.',
    stepNumber: 3,
  },
];

export default onboardingSteps;
