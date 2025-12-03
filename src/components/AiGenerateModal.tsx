import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { createStyles } from '../theme/styles';

const styles = createStyles(375);

interface AiGenerateModalProps {
  visible: boolean;
  onClose: () => void;
  onGenerate: (mealType: string) => void;
  preference: string;
  onPreferenceChange: (text: string) => void;
  isGenerating: boolean;
}

const AiGenerateModal: React.FC<AiGenerateModalProps> = ({
  visible,
  onClose,
  onGenerate,
  preference,
  onPreferenceChange,
  isGenerating,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalEmoji}>🤖</Text>
          <Text style={styles.modalTitle}>Generate AI Meal</Text>
          <Text style={styles.modalDesc}>Tell us your preferences</Text>
          
          <TextInput
            style={styles.input}
            placeholder="e.g., high protein, low carb, vegetarian..."
            value={preference}
            onChangeText={onPreferenceChange}
            placeholderTextColor="#999"
            multiline
          />
          
          <View style={styles.optionRow}>
            {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.optionBtn}
                onPress={() => onGenerate(type)}
                disabled={isGenerating}
              >
                <Text style={styles.optionBtnText}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {isGenerating && <ActivityIndicator size="large" color="#2E7D32" />}
          
          <TouchableOpacity style={styles.outlineBtn} onPress={onClose}>
            <Text style={styles.outlineBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default AiGenerateModal;
