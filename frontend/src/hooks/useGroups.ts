import { useQuery } from '@tanstack/react-query';
import { contactsApi } from '@/services/data.service';

export function useGroups() {
  return useQuery({
    queryKey: ['contact-groups'],
    queryFn: async () => {
      const res = await contactsApi.getGroups();
      return res.data.data;
    },
  });
}
