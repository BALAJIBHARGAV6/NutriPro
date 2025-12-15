import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import IllustratedAvatar from '../components/IllustratedAvatar';
import { User } from '../types';
import { storageService } from '../services/storageService';
import { databaseService } from '../services/databaseService';
import { isSupabaseConfigured } from '../config/supabase';
import { colors, shadows, spacing, borderRadius, typography, textStyles } from '../constants/theme';

interface ProfileScreenProps {
  user: User;
  onUpdateUser: (updates: Partial<User>) => void;
  onLogout: () => void;
  onRegenerateMeals: () => void;
}

const ProfileScreenNew: React.FC<ProfileScreenProps> = ({
  user,
  onUpdateUser,
  onLogout,
  onRegenerateMeals,
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddDiseaseModal, setShowAddDiseaseModal] = useState(false);
  const [newDisease, setNewDisease] = useState('');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar || '👤');

  // Modern teenage avatar options with 6 girls and 6 boys
  const avatarOptions = [
    // FEMALE TEENAGERS (1-6)
    { type: 1, gradient: ['#FFB4C5', '#E89BAB'], name: 'Emma' },      // Long hair girl
    { type: 2, gradient: ['#A8D5FF', '#7AB8E8'], name: 'Sophia' },    // Wavy hair girl
    { type: 3, gradient: ['#B4FFD9', '#8BE8B5'], name: 'Maya' },      // Curly/afro girl
    { type: 4, gradient: ['#FFD4E8', '#E8B0CD'], name: 'Olivia' },    // Ponytail girl
    { type: 5, gradient: ['#D4E8FF', '#B0CDE8'], name: 'Ava' },       // Side braid girl
    { type: 6, gradient: ['#FFE8B4', '#E8CD90'], name: 'Isabella' },  // Bob cut girl
    
    // MALE TEENAGERS (7-12)
    { type: 7, gradient: ['#B4A3FF', '#8B7FD6'], name: 'Liam' },      // Modern short cut boy
    { type: 8, gradient: ['#FFD4B4', '#E8B590'], name: 'Noah' },      // Styled quiff boy
    { type: 9, gradient: ['#E8FFB4', '#CDE890'], name: 'Oliver' },    // Fade haircut boy
    { type: 10, gradient: ['#B4E8FF', '#90CDE8'], name: 'Ethan' },    // Messy hair boy
    { type: 11, gradient: ['#FFB4E8', '#E890CD'], name: 'Mason' },    // Side-swept boy
    { type: 12, gradient: ['#D4FFB4', '#B5E890'], name: 'Lucas' },    // Curly short hair boy
  ];

  const commonDiseases = [
    'Diabetes Type 1', 'Diabetes Type 2', 'Hypertension', 'High Cholesterol',
    'Heart Disease', 'PCOD', 'Thyroid', 'Obesity', 'Asthma', 'Arthritis',
    'Celiac Disease', 'IBS', 'Kidney Disease', 'Liver Disease'
  ];

  const calculateBMI = (): { value: number; category: string } => {
    const bmi = user.weight / Math.pow(user.height / 100, 2);
    let category = 'Normal';
    if (bmi < 18.5) category = 'Underweight';
    else if (bmi >= 25 && bmi < 30) category = 'Overweight';
    else if (bmi >= 30) category = 'Obese';
    return { value: bmi, category };
  };

  const handleEdit = (field: string, currentValue: string | number) => {
    setEditingField(field);
    setEditValue(String(currentValue));
  };

  const handleSave = async () => {
    if (!editingField) return;

    let updates: Partial<User> = {};
    
    switch (editingField) {
      case 'fullName':
        updates.fullName = editValue;
        break;
      case 'age':
        updates.age = parseInt(editValue);
        break;
      case 'weight':
        updates.weight = parseFloat(editValue);
        updates.bmi = parseFloat(editValue) / Math.pow(user.height / 100, 2);
        break;
      case 'exerciseLevel':
        updates.exerciseLevel = editValue as any;
        break;
    }

    // Update in Supabase first
    if (isSupabaseConfigured) {
      try {
        await databaseService.updateUserProfile(updates);
        console.log('✅ Profile updated in Supabase');
      } catch (error) {
        console.error('Error updating Supabase:', error);
      }
    }
    
    // Also update locally
    await storageService.updateUser(updates);
    onUpdateUser(updates);
    setEditingField(null);
    setEditValue('');
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleAddDisease = async () => {
    if (!newDisease.trim()) return;

    const updatedDiseases = [...(user.diseases || []), newDisease.trim()];
    
    // Update in Supabase first
    if (isSupabaseConfigured) {
      try {
        await databaseService.updateUserProfile({ diseases: updatedDiseases });
        console.log('✅ Diseases updated in Supabase');
      } catch (error) {
        console.error('Error updating diseases in Supabase:', error);
      }
    }
    
    await storageService.updateUser({ diseases: updatedDiseases });
    onUpdateUser({ diseases: updatedDiseases });
    setNewDisease('');
    setShowAddDiseaseModal(false);
    
    Alert.alert(
      'Health Profile Updated',
      'Your meal plans have been refreshed based on your new health condition.',
      [{ text: 'OK', onPress: onRegenerateMeals }]
    );
  };

  const handleRemoveDisease = async (disease: string) => {
    Alert.alert(
      'Remove Condition',
      `Remove ${disease} from your profile?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updatedDiseases = (user.diseases || []).filter(d => d !== disease);
            
            // Update in Supabase first
            if (isSupabaseConfigured) {
              try {
                await databaseService.updateUserProfile({ diseases: updatedDiseases });
                console.log('✅ Diseases updated in Supabase');
              } catch (error) {
                console.error('Error updating diseases in Supabase:', error);
              }
            }
            
            await storageService.updateUser({ diseases: updatedDiseases });
            onUpdateUser({ diseases: updatedDiseases });
            Alert.alert(
              'Health Profile Updated',
              'Your meal plans have been refreshed.',
              [{ text: 'OK', onPress: onRegenerateMeals }]
            );
          },
        },
      ]
    );
  };

  const handleAvatarSelect = async (avatarData: { type: number; gradient: string[]; name: string }) => {
    const avatarString = JSON.stringify(avatarData);
    setSelectedAvatar(avatarString);
    setShowAvatarModal(false);
    
    // Update in Supabase first
    if (isSupabaseConfigured) {
      try {
        await databaseService.updateUserProfile({ avatar: avatarString });
        console.log('✅ Avatar updated in Supabase');
      } catch (error) {
        console.error('Error updating avatar:', error);
      }
    }
    
    // Always update local storage
    await storageService.updateUser({ avatar: avatarString });
    onUpdateUser({ avatar: avatarString });
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await storageService.clearUser();
            onLogout();
          },
        },
      ]
    );
  };

  const bmi = calculateBMI();

  const renderEditModal = () => (
    <Modal
      visible={editingField !== null}
      transparent
      animationType="fade"
      onRequestClose={() => setEditingField(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.editModal}>
          <Text style={styles.editModalTitle}>Edit {editingField}</Text>
          <TextInput
            style={styles.editInput}
            value={editValue}
            onChangeText={setEditValue}
            keyboardType={editingField === 'age' || editingField === 'weight' ? 'numeric' : 'default'}
            autoFocus
          />
          <View style={styles.editModalButtons}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setEditingField(null)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderAddDiseaseModal = () => (
    <Modal
      visible={showAddDiseaseModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowAddDiseaseModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.diseaseModal}>
          <Text style={styles.diseaseModalTitle}>Add Health Condition</Text>
          <TextInput
            style={styles.diseaseInput}
            placeholder="Search or type condition..."
            value={newDisease}
            onChangeText={setNewDisease}
          />
          <ScrollView style={styles.diseaseList}>
            {commonDiseases
              .filter(d => 
                d.toLowerCase().includes(newDisease.toLowerCase()) &&
                !(user.diseases || []).includes(d)
              )
              .map(disease => (
                <TouchableOpacity
                  key={disease}
                  style={styles.diseaseOption}
                  onPress={() => setNewDisease(disease)}
                >
                  <Text style={styles.diseaseOptionText}>{disease}</Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
          <View style={styles.diseaseModalButtons}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowAddDiseaseModal(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtnModal} onPress={handleAddDisease}>
              <Text style={styles.addBtnModalText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Clean Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>Manage your account</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={() => setShowAvatarModal(true)}>
            <LinearGradient
              colors={(() => {
                try {
                  const parsed = JSON.parse(selectedAvatar);
                  return parsed.gradient || [colors.primary, colors.primaryDark];
                } catch {
                  return [colors.primary, colors.primaryDark];
                }
              })()}
              style={styles.avatar}
            >
              <IllustratedAvatar
                type={(() => {
                  try {
                    return JSON.parse(selectedAvatar).type || 1;
                  } catch {
                    return 1;
                  }
                })()}
                size={80}
                backgroundColor="transparent"
              />
            </LinearGradient>
            <View style={styles.onlineIndicator} />
            <View style={styles.avatarEditBadge}>
              <Text style={styles.avatarEditIcon}>✏️</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.fullName || user.name || user.email?.split('@')[0] || 'User'}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
          </View>
          <TouchableOpacity style={styles.editProfileBtn} onPress={() => handleEdit('fullName', user.fullName || '')}>
            <Text style={styles.editProfileText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar Selection Modal */}
        <Modal visible={showAvatarModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.avatarModal}>
              <Text style={styles.avatarModalTitle}>Choose Your Avatar</Text>
              <Text style={styles.avatarModalSubtitle}>Select an avatar that represents you</Text>
              
              <ScrollView 
                style={styles.avatarScrollView}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.avatarGrid}>
                  {avatarOptions.map((avatar, index) => {
                    const isSelected = (() => {
                      try {
                        const parsed = JSON.parse(selectedAvatar);
                        return parsed.type === avatar.type && parsed.name === avatar.name;
                      } catch {
                        return false;
                      }
                    })();
                    
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.avatarOption,
                          isSelected && styles.avatarOptionSelected
                        ]}
                        onPress={() => handleAvatarSelect(avatar)}
                      >
                        <LinearGradient
                          colors={avatar.gradient}
                          style={styles.avatarOptionGradient}
                        >
                          <IllustratedAvatar
                            type={avatar.type}
                            size={64}
                            backgroundColor="transparent"
                          />
                        </LinearGradient>
                        <Text style={styles.avatarOptionName}>{avatar.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
              
              <TouchableOpacity 
                style={styles.avatarModalClose}
                onPress={() => setShowAvatarModal(false)}
              >
                <Text style={styles.avatarModalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{user.streak || 0}</Text>
            <Text style={styles.statLabel}>Day Streak 🔥</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{bmi.value.toFixed(1)}</Text>
            <Text style={styles.statLabel}>BMI ({bmi.category})</Text>
          </View>
        </View>

        {/* Section: Personal Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PERSONAL DETAILS</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <View style={styles.detailIconBox}><Text style={styles.detailIcon}>👤</Text></View>
              <View>
                <Text style={styles.detailLabel}>Full Name</Text>
                <Text style={styles.detailValue}>{user.fullName || user.name || 'Not set'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => handleEdit('fullName', user.fullName || '')}>
              <Text style={styles.detailAction}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <View style={styles.detailIconBox}><Text style={styles.detailIcon}>📧</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue} numberOfLines={1}>{user.email || 'Not set'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <View style={styles.detailIconBox}><Text style={styles.detailIcon}>🎂</Text></View>
              <View>
                <Text style={styles.detailLabel}>Age</Text>
                <Text style={styles.detailValue}>{user.age} years old</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => handleEdit('age', user.age)}>
              <Text style={styles.detailAction}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <View style={styles.detailIconBox}><Text style={styles.detailIcon}>{user.gender === 'male' ? '♂️' : '♀️'}</Text></View>
              <View>
                <Text style={styles.detailLabel}>Gender</Text>
                <Text style={styles.detailValue}>{user.gender === 'male' ? 'Male' : 'Female'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section: Body Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BODY METRICS</Text>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricEmoji}>⚖️</Text>
              <Text style={styles.metricNumber}>{user.weight}</Text>
              <Text style={styles.metricType}>kg</Text>
              <TouchableOpacity style={styles.metricBtn} onPress={() => handleEdit('weight', user.weight)}>
                <Text style={styles.metricBtnText}>Update</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricEmoji}>📏</Text>
              <Text style={styles.metricNumber}>{user.height}</Text>
              <Text style={styles.metricType}>cm</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: colors.primaryPale }]}>
              <Text style={styles.metricEmoji}>📊</Text>
              <Text style={[styles.metricNumber, { color: colors.primary }]}>{bmi.value.toFixed(1)}</Text>
              <Text style={[styles.metricType, { color: colors.primary }]}>BMI</Text>
              <Text style={styles.bmiCategory}>{bmi.category}</Text>
            </View>
          </View>
        </View>

        {/* Section: Health Conditions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>HEALTH CONDITIONS</Text>
            <TouchableOpacity onPress={() => setShowAddDiseaseModal(true)}>
              <Text style={styles.addBtn}>+ Add</Text>
            </TouchableOpacity>
          </View>
          
          {(user.diseases || []).length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>✅</Text>
              <Text style={styles.emptyText}>No health conditions</Text>
            </View>
          ) : (
            <View style={styles.chipContainer}>
              {(user.diseases || []).map(disease => (
                <View key={disease} style={styles.chip}>
                  <Text style={styles.chipText}>{disease}</Text>
                  <TouchableOpacity onPress={() => handleRemoveDisease(disease)}>
                    <Text style={styles.chipClose}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Section: Fitness */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FITNESS PROFILE</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <View style={styles.detailIconBox}><Text style={styles.detailIcon}>🏃</Text></View>
              <View>
                <Text style={styles.detailLabel}>Activity Level</Text>
                <Text style={styles.detailValue}>{user.exerciseLevel?.replace('_', ' ') || 'Moderate'}</Text>
              </View>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>Active</Text>
            </View>
          </View>

          <View style={styles.goalsBox}>
            <Text style={styles.goalsTitle}>Health Goals</Text>
            <View style={styles.goalsChips}>
              {(user.healthGoals || ['Stay Healthy']).map((goal, index) => (
                <View key={index} style={styles.goalTag}>
                  <Text style={styles.goalTagText}>{goal}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Section: Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SETTINGS</Text>
          
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🔔</Text>
              <Text style={styles.settingLabel}>Notifications</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>📏</Text>
              <Text style={styles.settingLabel}>Units: Metric</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🔒</Text>
              <Text style={styles.settingLabel}>Privacy</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>❓</Text>
              <Text style={styles.settingLabel}>Help & Support</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>NutriPro v1.0.0</Text>
        
        <View style={{ height: 80 }} />
      </ScrollView>

      {renderEditModal()}
      {renderAddDiseaseModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  
  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: '#F5F7FA',
  },
  headerTitle: {
    ...textStyles.h1,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
    marginTop: 4,
  },
  
  // Profile Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: 16,
    ...shadows.card,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    ...textStyles.h2,
    color: '#FFFFFF',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  profileName: {
    ...textStyles.h4,
    color: colors.textPrimary,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  editProfileBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primaryPale,
    borderRadius: 8,
  },
  editProfileText: {
    ...textStyles.label,
    color: colors.primary,
  },
  
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.soft,
  },
  statBoxHighlight: {
    backgroundColor: colors.primary,
  },
  statValue: {
    ...textStyles.number,
    color: colors.textPrimary,
  },
  statLabel: {
    ...textStyles.labelSmall,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Section
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: 16,
    padding: spacing.lg,
    ...shadows.soft,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...textStyles.overline,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  addBtn: {
    ...textStyles.label,
    color: colors.primary,
  },
  
  // Detail Row
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  detailIcon: {
    fontSize: 16,
  },
  detailLabel: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  detailValue: {
    ...textStyles.body,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  detailAction: {
    ...textStyles.label,
    color: colors.primary,
  },
  
  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.soft,
  },
  metricEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  metricNumber: {
    ...textStyles.displaySmall,
    fontSize: 28,
    color: colors.textPrimary,
  },
  metricType: {
    ...textStyles.label,
    color: colors.textMuted,
  },
  metricBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  metricBtnText: {
    ...textStyles.buttonSmall,
    fontSize: 12,
    color: '#FFFFFF',
  },
  bmiCategory: {
    ...textStyles.labelSmall,
    color: colors.primary,
    marginTop: 4,
    backgroundColor: colors.primaryPale,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  
  // Empty State
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
  },
  emptyEmoji: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  emptyText: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
  },
  
  // Chips
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#FECACA',
    ...shadows.soft,
  },
  chipText: {
    ...textStyles.label,
    color: '#DC2626',
  },
  chipClose: {
    fontSize: 20,
    color: '#DC2626',
    marginLeft: spacing.sm,
    fontWeight: '700',
  },
  
  // Level Badge
  levelBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  levelBadgeText: {
    ...textStyles.labelSmall,
    color: '#FFFFFF',
  },
  
  // Goals
  goalsBox: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  goalsTitle: {
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  goalsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  goalTag: {
    backgroundColor: colors.primaryPale,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  goalTagText: {
    fontSize: 13,
    color: colors.primary,
  },
  
  // Settings
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 18,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  settingArrow: {
    fontSize: 20,
    color: colors.textMuted,
  },
  
  // Logout
  logoutButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingVertical: 14,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  
  // Modal Styles (kept from original)
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModal: {
    width: '85%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.strong,
  },
  editModalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  editInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  editModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  cancelBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  saveBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  saveBtnText: {
    color: colors.textOnPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  diseaseModal: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.strong,
  },
  diseaseModalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  diseaseInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  diseaseList: {
    maxHeight: 200,
    marginBottom: spacing.md,
  },
  diseaseOption: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  diseaseOptionText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  diseaseModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  addBtnModal: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  addBtnModalText: {
    color: colors.textOnPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  
  // Avatar styles
  avatarEmoji: {
    fontSize: 48,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  avatarEditIcon: {
    fontSize: 12,
  },
  avatarModal: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.strong,
  },
  avatarModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  avatarModalSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  avatarScrollView: {
    width: '100%',
    maxHeight: 400,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  avatarOption: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarOptionGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    ...shadows.soft,
  },
  avatarOptionSelected: {
    borderColor: colors.primary,
    transform: [{ scale: 1.1 }],
  },
  avatarOptionEmoji: {
    fontSize: 36,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  avatarOptionName: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    fontWeight: '500',
  },
  avatarModalClose: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
  },
  avatarModalCloseText: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '600',
  },
});

export default ProfileScreenNew;
