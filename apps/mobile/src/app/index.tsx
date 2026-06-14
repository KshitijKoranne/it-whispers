import { useMemo } from "react";
import {
	ActivityIndicator,
	Linking,
	Pressable,
	SafeAreaView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { WebView } from "react-native-webview";

const configuredGameUrl = process.env.EXPO_PUBLIC_GAME_URL;
const missingGameUrlCopy = __DEV__
	? "The mobile shell is ready. Set EXPO_PUBLIC_GAME_URL to the hosted web game URL before creating a Play Store build."
	: "The game is temporarily unavailable. Please try again later.";

function normalizeGameUrl(value: string | undefined): string | null {
	if (!value) return null;

	const trimmed = value.trim();
	if (!trimmed) return null;

	try {
		const url = new URL(trimmed);
		if (url.protocol !== "https:" && url.protocol !== "http:") return null;
		if (!url.pathname || url.pathname === "/") {
			url.pathname = "/game";
		}
		return url.toString();
	} catch {
		return null;
	}
}

export default function Index() {
	const gameUrl = useMemo(() => normalizeGameUrl(configuredGameUrl), []);

	if (!gameUrl) {
		return (
			<SafeAreaView style={styles.safeArea}>
				<View style={styles.fallback}>
					<Text style={styles.kicker}>IT WHISPERS</Text>
					<Text style={styles.title}>The cemetery is waiting.</Text>
					<Text style={styles.copy}>{missingGameUrlCopy}</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.safeArea}>
			<WebView
				source={{ uri: gameUrl }}
				style={styles.webview}
				startInLoadingState
				allowsBackForwardNavigationGestures
				originWhitelist={["https://*", "http://*"]}
				renderLoading={() => (
					<View style={styles.loading}>
						<ActivityIndicator color="#c8bfaf" />
						<Text style={styles.loadingText}>opening the cemetery</Text>
					</View>
				)}
				renderError={() => (
					<View style={styles.fallback}>
						<Text style={styles.kicker}>IT WHISPERS</Text>
						<Text style={styles.title}>The path is blocked.</Text>
						<Text style={styles.copy}>
							The game could not be loaded. Check the network connection or open it
							in the browser.
						</Text>
						<Pressable style={styles.button} onPress={() => Linking.openURL(gameUrl)}>
							<Text style={styles.buttonText}>Open game</Text>
						</Pressable>
					</View>
				)}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#050505",
	},
	webview: {
		flex: 1,
		backgroundColor: "#050505",
	},
	loading: {
		...StyleSheet.absoluteFillObject,
		alignItems: "center",
		backgroundColor: "#050505",
		justifyContent: "center",
		gap: 14,
	},
	loadingText: {
		color: "#7f766a",
		fontSize: 13,
		letterSpacing: 1.4,
		textTransform: "uppercase",
	},
	fallback: {
		flex: 1,
		justifyContent: "center",
		paddingHorizontal: 28,
	},
	kicker: {
		color: "#777067",
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 2.8,
		marginBottom: 18,
	},
	title: {
		color: "#e0d8ca",
		fontSize: 34,
		fontWeight: "700",
		lineHeight: 40,
		marginBottom: 18,
	},
	copy: {
		color: "#9d9487",
		fontSize: 16,
		lineHeight: 24,
		maxWidth: 420,
	},
	button: {
		alignSelf: "flex-start",
		borderColor: "#4c453d",
		borderWidth: 1,
		marginTop: 28,
		paddingHorizontal: 18,
		paddingVertical: 12,
	},
	buttonText: {
		color: "#d8cec0",
		fontSize: 14,
		fontWeight: "700",
		letterSpacing: 1.2,
		textTransform: "uppercase",
	},
});
