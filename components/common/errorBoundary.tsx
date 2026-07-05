import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';
import { errorLogger } from '@/lib/errorLogger';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { ThemedText } from '@/components/ThemedText';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

const FallbackUI = React.memo(({ onRetry }: { onRetry: () => void }) => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.lottieContainer}>
        <LottieView
          source={require('@/public/json/no_connection.json')}
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>

      <View style={styles.textContainer}>
        <ThemedText style={styles.title}>
          Oops! Something went wrong
        </ThemedText>

        <ThemedText
          style={[styles.message, { color: colors.textSecondary }]}
        >
          We're having trouble loading this page. Please try again.
        </ThemedText>
      </View>

      <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={onRetry}>
        <ThemedText style={styles.modalButtonText}>Retry</ThemedText>
      </TouchableOpacity>
    </View>
  );
});

/**
 * React Error Boundary to catch rendering errors and show a user-friendly fallback.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    errorLogger.log(error, {
      type: 'COMPONENT_ERROR',
      componentStack: errorInfo.componentStack,
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <FallbackUI onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  lottieContainer: {
    width: 350,
    height: 350,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalButton: {
    width: 120,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
