import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import CustomHomeIcon from '../icons/HomePageIcon';
import CustomLearnIcon from '../icons/LearnPageIcon';
import CustomProfileIcon from '../icons/ProfilePageIcon';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const CustomNavBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.container}>
        {state.routes.map((route, index) => {
            console.log(route);

            if (["_sitemap", "+not-found"].includes(route.name)) return null;

            const { options } = descriptors[route.key];
            const label = String(
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

            return (
                <AnimatedTouchableOpacity
                layout={LinearTransition.springify().mass(0.5)}
                    key={route.key}
                    onPress={onPress}
                    style={[styles.tabItem, 
                    {backgroundColor: isFocused ? "#E7E7E9ff" : "transparent"}]}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                >
                    <View style={styles.iconWrapper}>
                        {getIconByRouteName(route.name, isFocused ? "#434241ff" : "#646464ff")}
                    </View>
                    {isFocused && <Animated.Text entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.text}>
                        {label as string}
                    </Animated.Text>}
                </AnimatedTouchableOpacity>
            );
        })}
    </View>
  );

  function getIconByRouteName(routeName: string, color: string) {
    const iconMap: Record<string, React.ReactNode> = {
        index: <CustomHomeIcon name="Home" color={color} />,
        Learn: <CustomLearnIcon name="Learn" color={color} />,
        profile: <CustomProfileIcon name="Profile" color={color} />,
      };
  
      return iconMap[routeName] || <CustomHomeIcon name="Home" color={color} />;
    }
  };


const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
        width: "80%",
        alignSelf: "center",
        bottom: 40,
        borderRadius: 40,
        paddingHorizontal: 6,
        paddingVertical: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    tabItem: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 36,
        paddingHorizontal: 30,
        borderRadius: 30,
    },
    iconWrapper: {
        justifyContent: 'center',
        alignItems: 'center', 
    },
    text: {
        color: "#434241ff",
        fontWeight: "bold",
        marginLeft: 8,
    }
})

export default CustomNavBar;