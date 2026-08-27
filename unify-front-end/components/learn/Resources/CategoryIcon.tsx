import React from 'react';
import type { SvgProps } from 'react-native-svg';
import type { PartnerCategory } from '@/types/partner';

import CommunityBelonging from '@/assets/icons/resources/communityBelonging.svg';
import FindWork from '@/assets/icons/resources/findWork.svg';
import GettingSettled from '@/assets/icons/resources/gettingSettled.svg';
import ImmigrationHelp from '@/assets/icons/resources/immigrationHelp.svg';
import Insurance from '@/assets/icons/resources/insurance.svg';
import InternationalStudents from '@/assets/icons/resources/internationalStudents.svg';
import LibrariesLearning from '@/assets/icons/resources/librariesLearning.svg';
import Money from '@/assets/icons/resources/money.svg';
import NetworksPlanning from '@/assets/icons/resources/networksPlanning.svg';

/**
 * Category glyphs exported from Figma (8129:32045) rather than drawn from an
 * icon font: the design uses Material Symbols Rounded, and `passport` — the
 * Immigration Help glyph — has no MaterialIcons equivalent, so the set would
 * otherwise mix two icon families.
 *
 * Each SVG carries its own glyph fill, a darker tone of the category's
 * PARTNER_CATEGORY_ICON_TINTS chip. Do not override it with a `color` prop.
 */
const CATEGORY_ICONS: Record<PartnerCategory, React.FC<SvgProps>> = {
  gettingSettled: GettingSettled,
  findWork: FindWork,
  immigrationHelp: ImmigrationHelp,
  librariesLearning: LibrariesLearning,
  communityBelonging: CommunityBelonging,
  networksPlanning: NetworksPlanning,
  internationalStudents: InternationalStudents,
  insurance: Insurance,
  money: Money,
};

type Props = {
  category: PartnerCategory;
  /** Rendered square edge in points. Figma draws these at 20. */
  size?: number;
};

export default function CategoryIcon({ category, size = 20 }: Props) {
  const Icon = CATEGORY_ICONS[category];
  return <Icon width={size} height={size} />;
}
