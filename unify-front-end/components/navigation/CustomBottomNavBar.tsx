import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useScrollContext } from '@/context/ScrollContext';
import CustomHomeIcon from '../icons/HomePageIcon';
import CustomlearnIcon from '../icons/LearnPageIcon';
import CustomProfileIcon from '../icons/ProfilePageIcon';
import CustomGatherIcon from '../icons/GatherPageIcon';
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import { useScrollVisibility } from '@/hooks/useScrollVisibility';

const NAV_BAR_HEIGHT = 50;
const OFFSET_BOTTOM = 15;

// Routes that should show the bottom navigation bar
const ALLOWED_ROUTES = ['index', 'Learn/index', 'Gather/gather'] as const;

const CustomNavBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const visibilityProgress = useScrollVisibility();

  // Hide the tab bar by transform it either rise it by the original value or 0 to kill it
  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          translateY:
            visibilityProgress.value * (NAV_BAR_HEIGHT + OFFSET_BOTTOM),
        },
      ],
    }),
    [visibilityProgress]
  );

  // Completely hide navbar for certain routes (going to have to start using this more and add this into the chatbot button)
  const currentRoute = state.routes[state.index];
  const hiddenRoutes = ['Gather/EventDetailScreen', 'Gather/EventsScreen'];
  if (hiddenRoutes.includes(currentRoute.name)) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {state.routes.map((route, index) => {
        if (!ALLOWED_ROUTES.includes(route.name as any)) {
          return null;
        }

        const { options } = descriptors[route.key];
        let label = String(
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name
        );

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        const primaryColor = '#2F97C4';
        const whiteColor = '#FFFFFF';
        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={[
              styles.tabItem,
              { backgroundColor: isFocused ? primaryColor : whiteColor },
            ]}
            accessibilityRole='button'
            accessibilityLabel={label}
          >
            {getIconByRouteName(
              route.name,
              isFocused ? whiteColor : primaryColor,
              isFocused
            )}
            <Text style={{ color: isFocused ? whiteColor : primaryColor }}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );

  function getIconByRouteName(
    routeName: string,
    color: string,
    isFocused: boolean
  ): React.ReactNode {
    const iconMap: Record<string, React.ReactNode> = {
      index: <CustomHomeIcon color={color} focused={isFocused} />,
      'Learn/index': <CustomlearnIcon color={color} focused={isFocused} />,
      'Gather/gather': <CustomGatherIcon color={color} />,
      profile: (
        <CustomProfileIcon name={'Profile'} color={color} focused={isFocused} />
      ),
    };

    return (
      iconMap[routeName] || <CustomHomeIcon color={color} focused={isFocused} />
    );
  }
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    flexDirection: 'row',
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'center',
    flexShrink: 0,
    bottom: OFFSET_BOTTOM,
    width: 365,
    height: NAV_BAR_HEIGHT,
    borderRadius: 25,
    borderCurve: 'continuous',
    paddingHorizontal: 4,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderCurve: 'continuous',
    gap: 8,
  },
  text: {
    color: '#000000',
  },
});

export default CustomNavBar;
