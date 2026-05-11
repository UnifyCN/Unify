const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

module.exports = {
  expo: {
    name: 'Unify',
    slug: 'unify-front-end',
    owner: 'unifysocial',
    version: '1.4.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    runtimeVersion: 'exposdk:55.0.0',
    updates: {
      url: 'https://u.expo.dev/3772d4d9-79dd-4848-9691-bae1b19eefb8',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.anonymous.unifyfrontend',
      googleServicesFile: './GoogleService_ios.plist',
      infoPlist: {
        NSCameraUsageDescription:
          'Unify needs camera access to let you take a photo for your post.',
        NSPhotoLibraryUsageDescription:
          'Unify needs access to your photo library to attach an existing photo to your post.',
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      permissions: ['CAMERA', 'READ_MEDIA_IMAGES', 'READ_EXTERNAL_STORAGE'],
      package: 'com.anonymous.unifyfrontend',
      softwareKeyboardLayoutMode: 'resize',
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-image',
      'expo-apple-authentication',
      [
        'expo-image-picker',
        {
          photosPermission:
            'Unify needs access to your photo library to attach an existing photo to your post.',
          cameraPermission:
            'Unify needs camera access to let you take a photo for your post.',
        },
      ],
      'expo-localization',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#ffffff',
          image: './assets/images/splash-icon-light.png',
          dark: {
            image: './assets/images/splash-icon-dark.png',
            backgroundColor: '#000000',
          },
          imageWidth: 200,
        },
      ],
      [
        'expo-notifications',
        {
          color: '#ff9d40',
          defaultChannel: 'social',
        },
      ],
      '@react-native-google-signin/google-signin',
      'expo-secure-store',
      'expo-tracking-transparency',
      [
        'react-native-fbsdk-next',
        {
          appID: process.env.META_APP_ID,
          clientToken: process.env.META_CLIENT_TOKEN,
          displayName: 'Unify',
          scheme: `fb${process.env.META_APP_ID}`,
          advertiserIDCollectionEnabled: true,
          autoLogAppEventsEnabled: false,
          isAutoInitEnabled: false,
          iosUserTrackingPermission:
            'Allowing tracking helps us show you relevant ads and improve Unify for our community.',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: '3772d4d9-79dd-4848-9691-bae1b19eefb8',
      },
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
  },
};
