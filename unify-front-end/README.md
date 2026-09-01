# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Resources analytics contract

Web and mobile must use the same event names and property meanings:

| Event | Properties | Meaning |
| --- | --- | --- |
| `resources_viewed` | none | Directory rendered. |
| `resources_category_opened` | `category` | Category selected. |
| `resources_partner_opened` | `slug`, `category`, `partnership_type` | Partner detail rendered. |
| `resources_partner_website_clicked` | `slug`, `partnership_type` | Valid website CTA clicked, before platform navigation. |
| `resources_program_clicked` | `slug`, `program_id` | Valid program link clicked, before platform navigation. |
| `resources_link_failed` | `slug`, `target`, `reason`; optional `program_id` | URL validation or platform navigation failed. |

`program_id` is immutable identity. Dashboards resolve display labels from the
partner catalog instead of capturing mutable program names.
`target` is `partner_website`, `program`, `phone`, `email`, or `directions`.
`reason` is `invalid_url` or `launch_failed`. There is deliberately no website
or program `opened` event because native browser promises resolve differently
across platforms.
