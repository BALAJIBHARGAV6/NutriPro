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
import { User } from '../types';
import { storageService } from '../services/storageService';
import { databaseService } from '../services/databaseService';
import { isSupabaseConfigured } from '../config/supabase';

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
            <TouchableOpacity style={styles.addBtn} onPress={handleAddDisease}>
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>👤 PROFILE</Text>
        </View>

        {/* Profile Photo */}
        <View style={styles.photoSection}>
          <View style={styles.photoContainer}>
            <Text style={styles.photoEmoji}>👤</Text>
          </View>
          <TouchableOpacity style={styles.changePhotoBtn}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 PERSONAL INFORMATION</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>{user.fullName || user.name || 'User'}</Text>
              <TouchableOpacity onPress={() => handleEdit('fullName', user.fullName || user.name || 'User')}>
                <Text style={styles.editBtn}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Age</Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>{user.age}</Text>
              <TouchableOpacity onPress={() => handleEdit('age', user.age)}>
                <Text style={styles.editBtn}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gender</Text>
            <Text style={styles.infoValue}>{user.gender}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
        </View>

        {/* Physical Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📏 PHYSICAL METRICS</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Weight</Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>{user.weight} kg</Text>
              <TouchableOpacity onPress={() => handleEdit('weight', user.weight)}>
                <Text style={styles.editBtn}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Height</Text>
            <Text style={styles.infoValue}>{user.height} cm</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>BMI</Text>
            <Text style={[styles.infoValue, { color: '#2E7D32' }]}>
              {bmi.value.toFixed(1)} ({bmi.category})
            </Text>
          </View>

          <TouchableOpacity style={styles.viewHistoryBtn}>
            <Text style={styles.viewHistoryText}>View Weight History Graph</Text>
          </TouchableOpacity>
        </View>

        {/* Health Conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚕️ HEALTH CONDITIONS</Text>
          <Text style={styles.sectionSubtitle}>Current Diseases:</Text>
          
          {(user.diseases || []).length === 0 ? (
            <Text style={styles.noConditions}>No health conditions added</Text>
          ) : (
            (user.diseases || []).map(disease => (
              <View key={disease} style={styles.diseaseRow}>
                <Text style={styles.diseaseText}>• {disease}</Text>
                <TouchableOpacity onPress={() => handleRemoveDisease(disease)}>
                  <Text style={styles.removeBtn}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          <TouchableOpacity
            style={styles.addDiseaseBtn}
            onPress={() => setShowAddDiseaseModal(true)}
          >
            <Text style={styles.addDiseaseBtnText}>+ Add New Disease</Text>
          </TouchableOpacity>
        </View>

        {/* Fitness Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏃 FITNESS INFORMATION</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Exercise Level</Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>
                {user.exerciseLevel?.replace('_', ' ')}
              </Text>
              <TouchableOpacity onPress={() => handleEdit('exerciseLevel', user.exerciseLevel)}>
                <Text style={styles.editBtn}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Health Goals</Text>
            <Text style={styles.infoValue}>
              {(user.healthGoals || []).join(', ') || 'Not set'}
            </Text>
          </View>
        </View>

        {/* Progress Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 PROGRESS STATS</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{user.totalMealsLogged || 0}</Text>
              <Text style={styles.statLabel}>Meals Logged</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>🔥 {user.streak || 0}</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{user.longestStreak || 0}</Text>
              <Text style={styles.statLabel}>Longest Streak</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.viewAnalyticsBtn}>
            <Text style={styles.viewAnalyticsText}>View Detailed Analytics</Text>
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ SETTINGS</Text>
          
          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingText}>Change Password</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingText}>Notification Preferences</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingText}>Units: {user.unitsPreference || 'Metric'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingText}>Export My Data</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {renderEditModal()}
      {renderAddDiseaseModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#84C225',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  photoSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'white',
  },
  photoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoEmoji: {
    fontSize: 48,
  },
  changePhotoBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changePhotoText: {
    color: '#84C225',
    fontWeight: '500',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  editBtn: {
    color: '#84C225',
    marginLeft: 12,
    fontWeight: '500',
  },
  viewHistoryBtn: {
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  viewHistoryText: {
    textAlign: 'center',
    color: '#84C225',
    fontWeight: '500',
  },
  noConditions: {
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  diseaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  diseaseText: {
    fontSize: 14,
    color: '#333',
  },
  removeBtn: {
    color: '#F44336',
    fontWeight: '500',
  },
  addDiseaseBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#84C225',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addDiseaseBtnText: {
    textAlign: 'center',
    color: '#84C225',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#84C225',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  viewAnalyticsBtn: {
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  viewAnalyticsText: {
    textAlign: 'center',
    color: '#84C225',
    fontWeight: '500',
  },
  settingRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingText: {
    fontSize: 14,
    color: '#333',
  },
  logoutBtn: {
    marginTop: 16,
    paddingVertical: 16,
    backgroundColor: '#F44336',
    borderRadius: 8,
  },
  logoutBtnText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModal: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  editModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 8,
  },
  cancelBtnText: {
    color: '#666',
    fontWeight: '500',
  },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#2E7D32',
    borderRadius: 8,
  },
  saveBtnText: {
    color: 'white',
    fontWeight: '500',
  },
  diseaseModal: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
  },
  diseaseModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  diseaseInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  diseaseList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  diseaseOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  diseaseOptionText: {
    fontSize: 14,
    color: '#333',
  },
  diseaseModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  addBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#2E7D32',
    borderRadius: 8,
  },
  addBtnText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default ProfileScreenNew;
