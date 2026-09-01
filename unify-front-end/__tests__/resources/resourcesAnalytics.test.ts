import { act, renderHook } from '@testing-library/react-native';
import { usePostHog } from 'posthog-react-native';

import { AnalyticsEvents, useAnalytics } from '@/utils/analytics';

jest.mock('posthog-react-native', () => ({
  usePostHog: jest.fn(),
}));

const mockUsePostHog = jest.mocked(usePostHog);

describe('Resources analytics', () => {
  it('identifies program clicks with stable catalog fields only', () => {
    const capture = jest.fn();
    mockUsePostHog.mockReturnValue({ capture } as never);
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackResourcesProgramClicked(
        'canada-shaw-education-centre',
        'canada-shaw-settlement-support'
      );
    });

    expect(capture).toHaveBeenCalledWith(
      AnalyticsEvents.RESOURCES_PROGRAM_CLICKED,
      {
        slug: 'canada-shaw-education-centre',
        program_id: 'canada-shaw-settlement-support',
      }
    );
  });
});
