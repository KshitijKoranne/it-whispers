/**
 * Native shell root. Auth is intentionally not mounted for the first release:
 * progress is local, paid content is marked coming soon, and there are no
 * account-only flows yet.
 */
'use client';

import { ErrorBoundary } from "@/__create/ErrorBoundary";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			gcTime: 1000 * 60 * 30, // 30 minutes
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});

export default function RootLayout() {
	useEffect(() => {
		void SplashScreen.hideAsync();
	}, []);

	return (
		<ErrorBoundary>
			<QueryClientProvider client={queryClient}>
				<GestureHandlerRootView style={{ flex: 1 }}>
					<Stack screenOptions={{ headerShown: false }} initialRouteName="index">
						<Stack.Screen name="index" />
					</Stack>
				</GestureHandlerRootView>
			</QueryClientProvider>
		</ErrorBoundary>
	);
}
