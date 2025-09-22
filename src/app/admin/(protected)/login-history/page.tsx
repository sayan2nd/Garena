import LoginHistoryManager from './_components/login-history-manager';
import { unstable_noStore as noStore } from 'next/cache';

export default async function LoginHistoryPage() {
    noStore();
    return <LoginHistoryManager />;
}
