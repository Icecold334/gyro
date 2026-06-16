import { Redirect } from 'expo-router';

export default function Index() {
    // Masuk via folder auth
    return <Redirect href="/auth/login" />;
}
