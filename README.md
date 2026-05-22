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

## Mera Pind - Share Banner
The **Share Banner** is a dynamic, premium UI component designed for the Mera Pind (Village Pride & Achievers Hall) module. It allows users to generate viral social media share cards for village heroes, deceased pioneers, and living legends.

### Features
- Dynamic QR code pointing directly to the app profile deep link (`rehbar://pride/[id]`).
- Clean, responsive glassmorphism and gradient background using `#009688`.
- Integrates with `useShareBanner` hook for capturing the view, saving to the device gallery, and sharing via the native OS share sheet.
- RTL/Urdu typography support for specific memorial text.

### Usage
In `app/pride/[id].tsx`, tapping the "Share Banner" button triggers a modal overlay showing a preview. The underlying view is captured using `react-native-view-shot` and the resulting image URI is managed by the `useShareBanner` hook, which provides seamless `save()` and `share()` methods.
