import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';

// Dynamically import WebView to handle cases where native module isn't available (e.g., Expo Go)
let WebView: any = null;
try {
  WebView = require('react-native-webview').WebView;
} catch {
  // WebView not available - will fall back to browser
}

interface LegalWebViewProps {
  url: string;
  title: string;
  onClose: () => void;
  /** Allowed domain for navigation. Defaults to notion.so */
  allowedDomain?: string;
}

/**
 * Full-screen WebView for displaying legal documents (Privacy Policy, Community Guidelines).
 * Features:
 * - Close button
 * - Loading spinner
 * - Error state with retry
 * - Navigation restricted to allowed domain
 * - Graceful fallback to browser when WebView is unavailable (e.g., in Expo Go)
 */
export default function LegalWebView({
  url,
  title,
  onClose,
  allowedDomain = 'notion.so',
}: LegalWebViewProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [key, setKey] = useState(0); // For retry functionality
  const [webViewAvailable, setWebViewAvailable] = useState(WebView !== null);

  // If WebView isn't available, open in browser and close
  useEffect(() => {
    if (!webViewAvailable) {
      Linking.openURL(url).catch(() => {
        // If browser fails to open, show error state
        setError(true);
      });
    }
  }, [webViewAvailable, url]);

  const handleShouldStartLoad = (event: { url: string }) => {
    if (event.url === 'about:blank') {
      return true;
    }

    let isAllowed = false;
    let isValidUrl = true;
    try {
      const urlObj = new URL(event.url);
      // Check hostname ends with the allowed domain (handles subdomains)
      isAllowed =
        urlObj.hostname === allowedDomain ||
        urlObj.hostname.endsWith('.' + allowedDomain);
    } catch {
      // Invalid URL, don't allow and don't try to open externally
      isAllowed = false;
      isValidUrl = false;
    }

    if (!isAllowed) {
      if (isValidUrl) {
        Linking.openURL(event.url).catch(() => {
          // Silently fail if URL cannot be opened
        });
      }
      return false;
    }
    return true;
  };

  const handleRetry = () => {
    if (!webViewAvailable) {
      // Try opening in browser again
      Linking.openURL(url).catch(() => {
        setError(true);
      });
      return;
    }
    setError(false);
    setLoading(true);
    setKey(prev => prev + 1);
  };

  const handleOpenInBrowser = () => {
    Linking.openURL(url).catch(() => {
      // Silently fail
    });
    onClose();
  };

  // Fallback UI when WebView isn't available
  if (!webViewAvailable) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color={Theme.black} />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.content}>
          <View style={styles.fallbackContainer}>
            <Feather name="external-link" size={48} color={Theme.textInput} />
            <Text style={styles.fallbackText}>
              Opening in your browser...
            </Text>
            <Text style={styles.fallbackSubtext}>
              If the page doesn't open automatically, tap the button below.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleOpenInBrowser}>
              <Text style={styles.retryButtonText}>Open in Browser</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeTextButton} onPress={onClose}>
              <Text style={styles.closeTextButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Feather name="x" size={24} color={Theme.black} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {error ? (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={48} color={Theme.textInput} />
            <Text style={styles.errorText}>Couldn't load the document</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <WebView
              key={key}
              source={{ uri: url }}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
              onHttpError={() => {
                setLoading(false);
                setError(true);
              }}
              onShouldStartLoadWithRequest={handleShouldStartLoad}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={false}
              style={styles.webview}
            />
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={Theme.primaryGatherRed} />
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e4e4e4',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.black,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: Theme.textInput,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Theme.primaryGatherRed,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    color: Theme.white,
    fontSize: 16,
    fontWeight: '600',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  fallbackText: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.black,
    marginTop: 16,
    textAlign: 'center',
  },
  fallbackSubtext: {
    fontSize: 14,
    color: Theme.textInput,
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
  },
  closeTextButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  closeTextButtonText: {
    fontSize: 16,
    color: Theme.textInput,
  },
});
