import { useAuth } from '../context/AuthContext';
import { DEFAULT_CURRENCY } from '../constants';

export function useCurrency() {
  const { user } = useAuth();
  return user?.user_metadata?.currency || DEFAULT_CURRENCY;
}
