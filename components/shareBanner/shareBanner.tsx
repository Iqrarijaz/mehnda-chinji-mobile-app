import React, { forwardRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import WhiteLogo from './WhiteLogo';

const { width, height } = Dimensions.get('window');

interface ShareBannerProps {
  post: any;
  style?: any;
}

const ShareBanner = forwardRef<View, ShareBannerProps>(
  ({ post, style }, ref) => {
    const metadata = post?.metadata || {};

    const fullName = metadata?.fullName || 'Community Hero';
    const title = metadata?.title || 'Honored Villager';
    const achievements = metadata?.achievements || [];
    const dateOfBirth = metadata?.dateOfBirth;
    const dateOfDeath = metadata?.dateOfDeath;

    const image =
      metadata?.profileImage ||
      post?.images?.[0] ||
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1200&auto=format&fit=crop';

    const subType = post?.type || 'LIVING_LEGEND';

    const getMeta = () => {
      switch (subType) {
        case 'YOUTH_PRIDE':
          return {
            label: 'Youth Pride',
            color: '#10B981',
            icon: 'star',
          };

        case 'DECEASED':
          return {
            label: 'In Memoriam',
            color: '#94A3B8',
            icon: 'praying-hands',
          };

        default:
          return {
            label: 'Living Legend',
            color: '#FF9B51',
            icon: 'ribbon',
          };
      }
    };

    const meta = getMeta();

    return (
      <View
        ref={ref}
        collapsable={false}
        style={[styles.container, style]}
      >
        {/* Main Background Gradient */}
        <LinearGradient
          colors={[
            '#1E293B',
            '#0F172A',
            '#020617',
          ]}
          style={styles.overlay}
        />

        {/* Decorative Glow */}
        <View
          style={[
            styles.glow,
            {
              backgroundColor: meta.color,
            },
          ]}
        />

        {/* Top Badge */}
        <View
          style={[
            styles.badge,
            {
              backgroundColor: meta.color,
            },
          ]}
        >
          <Text style={styles.badgeText}>{meta.label.toUpperCase()}</Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Avatar */}
          <View
            style={[
              styles.avatarWrapper,
              {
                borderColor: meta.color,
              },
            ]}
          >
            <Image
              source={{ uri: image }}
              style={styles.avatar}
              resizeMode="cover"
            />
          </View>

          {/* Name */}
          <Text style={styles.name}>{fullName}</Text>

          {/* Title */}
          <Text style={[styles.title, { marginBottom: subType === 'DECEASED' ? 20 : 42 }]}>{title}</Text>

          {/* Memoriam Dates & Verse */}
          {subType === 'DECEASED' && (
            <>
              {(dateOfBirth || dateOfDeath) && (
                <View style={styles.dateBadge}>
                  <Text style={styles.dateText}>
                    {dateOfBirth ? dateOfBirth.slice(0, 10) : 'Unknown'}   —   {dateOfDeath ? dateOfDeath.slice(0, 10) : 'Present'}
                  </Text>
                </View>
              )}
              <Text style={styles.arabicVerse}>
                إِنَّا لِلَّٰهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ
              </Text>
            </>
          )}

          {/* Quote Card */}
          <View style={styles.quoteCard}>
            <Ionicons
              name="sparkles-outline"
              size={22}
              color="#FFFFFF"
            />

            <Text style={styles.quoteText} numberOfLines={5}>
              {post?.content ||
                'A respected member of the community whose contributions continue to inspire generations.'}
            </Text>
          </View>

          {/* Achievements */}
          {achievements?.length > 0 && (
            <View style={styles.achievementsContainer}>
              {achievements.slice(0, 4).map((item: string, index: number) => (
                <View key={index} style={styles.achievementPill}>
                  <Text style={styles.achievementText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Tribute Card */}
          <View style={styles.tributeCard}>
            <View style={styles.tributeIconWrap}>
              {meta.icon === 'praying-hands' ? (
                <FontAwesome5
                  name="praying-hands"
                  size={18}
                  color={meta.color}
                />
              ) : (
                <Ionicons
                  name={meta.icon as any}
                  size={20}
                  color={meta.color}
                />
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.tributeTitle}>Community Tribute</Text>

              <Text style={styles.tributeSubtitle}>
                Shared proudly through Rehbar Community Platform
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={{ width: 220, height: 60, marginBottom: 12 }}>
            <WhiteLogo />
          </View>
          <Text style={styles.footerSubtitle}>
            Download Rehbar from Google Play Store
          </Text>
        </View>
      </View>
    );
  }
);

export default ShareBanner;

const styles = StyleSheet.create({
  container: {
    width: 1080,
    height: 1920,
    backgroundColor: '#000000',
    overflow: 'hidden',
    position: 'relative',
  },

  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },

  glow: {
    position: 'absolute',
    width: 520,
    height: 520,
    borderRadius: 260,
    top: -100,
    right: -100,
    opacity: 0.2,
  },

  badge: {
    position: 'absolute',
    top: 110,
    alignSelf: 'center',
    paddingHorizontal: 34,
    paddingVertical: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },

    }),
  },

  badgeText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 80,
    paddingTop: 120,
  },

  avatarWrapper: {
    width: 270,
    height: 270,
    borderRadius: 135,
    borderWidth: 8,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: 42,
  },

  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },

  name: {
    color: '#FFFFFF',
    fontSize: 58,
    fontWeight: '900',
    lineHeight: 72,
    textAlign: 'center',
  },

  title: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 30,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 40,
  },

  dateBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  dateText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  arabicVerse: {
    color: '#FFFFFF',
    fontSize: 48,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'serif',
    marginBottom: 42,
    opacity: 0.9,
    textAlign: 'center',
  },

  quoteCard: {
    width: '100%',
    borderRadius: 42,
    padding: 42,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    gap: 20,
  },

  quoteText: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 52,
    textAlign: 'center',
    fontWeight: '500',
  },

  achievementsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginTop: 38,
  },

  achievementPill: {
    paddingHorizontal: 26,
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },

  achievementText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },

  tributeCard: {
    width: '100%',
    marginTop: 48,
    borderRadius: 36,
    padding: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
  },

  tributeIconWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  tributeTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },

  tributeSubtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 22,
    marginTop: 6,
    lineHeight: 32,
  },

  footer: {
    position: 'absolute',
    left: 60,
    right: 60,
    bottom: 60,
    alignItems: 'center',
    paddingVertical: 36,
    backgroundColor: '#0F172A',
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  footerTitle: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 5,
  },

  footerSubtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 22,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 32,
  },
});
