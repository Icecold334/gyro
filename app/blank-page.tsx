import { Text, View } from 'react-native';

export default function BlankPage() {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Ini adalah halaman blank tanpa bottom bar!</Text>
        </View>
    );
}