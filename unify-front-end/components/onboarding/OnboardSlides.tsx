import OnboardingOne from '../../assets/images/onboardingSvgOne.svg';
import OnboardingTwo from '../../assets/images/onboardingSvgTwo.svg';
import OnboardingThree from '../../assets/images/onboardingSvgThree.svg';
import { FC } from 'react';

type OnboardSlide = {
  id: string;
  graphic: FC;
  title: string;
  description: string;
};

const OnboardSlides: OnboardSlide[] = [
  {
    id: "1",
    graphic: OnboardingOne,
    title: "Fostering Community",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut.",
  },
  {
    id: "2",
    graphic: OnboardingTwo,
    title: "Empowering Learning",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut.",
  },
  {
    id: "3",
    graphic: OnboardingThree,
    title: "Providing Resources",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut.",
  },
];

export default OnboardSlides;