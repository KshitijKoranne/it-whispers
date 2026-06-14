import { Stack, useRouter } from 'expo-router';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Not Found', headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.kicker}>IT WHISPERS</Text>
          <Text style={styles.title}>This path is closed.</Text>
          <Text style={styles.copy}>
            The cemetery does not open this way. Return to the game and keep your light close.
          </Text>
          <Pressable style={styles.button} onPress={() => router.replace('/')}>
            <Text style={styles.buttonText}>Return</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050505',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  kicker: {
    color: '#777067',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2.8,
    marginBottom: 18,
  },
  title: {
    color: '#e0d8ca',
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 40,
    marginBottom: 18,
  },
  copy: {
    color: '#9d9487',
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 420,
  },
  button: {
    alignSelf: 'flex-start',
    borderColor: '#4c453d',
    borderWidth: 1,
    marginTop: 28,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#d8cec0',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
