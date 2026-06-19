import React, { useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

interface CustomPromptModalProps {
  visible: boolean
  title: string
  message: string
  placeholder?: string
  confirmText?: string
  cancelText?: string
  onConfirm: (value: string) => void
  onCancel: () => void
}

export default function CustomPromptModal({
  visible,
  title,
  message,
  placeholder = '',
  confirmText = 'OK',
  cancelText = 'Batal',
  onConfirm,
  onCancel,
}: CustomPromptModalProps) {
  const [value, setValue] = useState('')

  const handleConfirm = () => {
    onConfirm(value)
    setValue('')
  }

  const handleCancel = () => {
    onCancel()
    setValue('')
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 32,
          }}
        >
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 24,
              width: '100%',
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#1b1c1d',
                marginBottom: 6,
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: '#44474c',
                marginBottom: 16,
              }}
            >
              {message}
            </Text>

            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder={placeholder}
              placeholderTextColor="#9e9e9e"
              autoFocus
              style={{
                borderWidth: 1,
                borderColor: '#c4c6cd',
                borderRadius: 8,
                paddingHorizontal: 14,
                paddingVertical: 10,
                fontSize: 15,
                color: '#1b1c1d',
                marginBottom: 20,
                backgroundColor: '#fbf9fa',
              }}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={handleCancel}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#c4c6cd',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontWeight: '600', color: '#44474c' }}>
                  {cancelText}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirm}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: '#041627',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontWeight: 'bold', color: '#fff' }}>
                  {confirmText}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
