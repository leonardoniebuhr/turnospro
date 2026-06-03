import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export function useStats(period?: string) {
  return useQuery({
    queryKey: ['stats', period],
    queryFn: async () => {
      const { data } = await api.get('/stats', { params: { period } });
      return data;
    }
  });
}

export function useProfesionales() {
  return useQuery({
    queryKey: ['profesionales'],
    queryFn: async () => {
      const { data } = await api.get('/profesionales');
      return data;
    }
  });
}

export function useConsultorios() {
  return useQuery({
    queryKey: ['consultorios'],
    queryFn: async () => {
      const { data } = await api.get('/consultorios');
      return data;
    }
  });
}

export function useCreateConsultorio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post('/consultorios', payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['consultorios'] })
  });
}

export function useUpdateConsultorio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const { data } = await api.put(`/consultorios/${id}`, payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['consultorios'] })
  });
}

export function useCreateProfesional() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post('/profesionales', payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profesionales'] })
  });
}

export function useUpdateProfesional() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const { data } = await api.put(`/profesionales/${id}`, payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profesionales'] })
  });
}

export function useDeleteProfesional() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/profesionales/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profesionales'] })
  });
}

export function useDeleteConsultorio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/consultorios/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['consultorios'] })
  });
}

export function useCreatePaciente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post('/pacientes', payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pacientes'] })
  });
}

export function useUpdatePaciente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const { data } = await api.put(`/pacientes/${id}`, payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pacientes'] })
  });
}

export function useDeletePaciente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/pacientes/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pacientes'] })
  });
}

export function useUpdateTurno() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const { data } = await api.put(`/turnos/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos'] });
      queryClient.invalidateQueries({ queryKey: ['accounting'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    }
  });
}

export function useDeleteTurno() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/turnos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos'] });
      queryClient.invalidateQueries({ queryKey: ['accounting'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    }
  });
}

export function useDeletePago() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (turnoId: string) => {
      await api.delete(`/turnos/${turnoId}/pago`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos'] });
      queryClient.invalidateQueries({ queryKey: ['accounting'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    }
  });
}

export function useProfHorarios(profId: string) {
  return useQuery({
    queryKey: ['profesionales', profId, 'horarios'],
    queryFn: async () => {
      const { data } = await api.get(`/profesionales/${profId}/horarios`);
      return data;
    },
    enabled: !!profId
  });
}

export function useCreateHorario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ profId, ...payload }: any) => {
      const { data } = await api.post(`/profesionales/${profId}/horarios`, payload);
      return data;
    },
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: ['profesionales', variables.profId, 'horarios'] })
  });
}

export function useDeleteHorario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string, profId: string }) => {
      await api.delete(`/profesionales/horarios/${id}`);
    },
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: ['profesionales', variables.profId, 'horarios'] })
  });
}

export function useTurnos(filters: { start?: string; end?: string; profesionalId?: string; consultorioId?: string } = {}) {
  return useQuery({
    queryKey: ['turnos', filters],
    queryFn: async () => {
      const { data } = await api.get('/turnos', { params: filters });
      return data;
    }
  });
}

export function useCreateTurno() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (turnoData: any) => {
      const { data } = await api.post('/turnos', turnoData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos'] });
      queryClient.invalidateQueries({ queryKey: ['accounting'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    }
  });
}

export function usePacientes(search?: string) {
  return useQuery({
    queryKey: ['pacientes', search],
    queryFn: async () => {
      const { data } = await api.get('/pacientes', { params: { search } });
      return data;
    }
  });
}

export function usePaciente(id?: string) {
  return useQuery({
    queryKey: ['pacientes', id],
    queryFn: async () => {
      const { data } = await api.get(`/pacientes/${id}`);
      return data;
    },
    enabled: !!id
  });
}

export function useObraSociales() {
  return useQuery({
    queryKey: ['obras-sociales'],
    queryFn: async () => {
      const { data } = await api.get('/obras-sociales');
      return data;
    }
  });
}

export function useCreateObraSocial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post('/obras-sociales', payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['obras-sociales'] })
  });
}

export function useUpdateObraSocial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const { data } = await api.put(`/obras-sociales/${id}`, payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['obras-sociales'] })
  });
}

export function useDeleteObraSocial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/obras-sociales/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['obras-sociales'] })
  });
}

export function useAccounting(filters: { start?: string, end?: string, profesionalId?: string }) {
  return useQuery({
    queryKey: ['accounting', filters],
    queryFn: async () => {
      const { data } = await api.get('/accounting', { params: filters });
      return data;
    }
  });
}

export function useRecetaTemplates() {
  return useQuery({
    queryKey: ['receta-templates'],
    queryFn: async () => {
      const { data } = await api.get('/receta-templates');
      return data;
    }
  });
}

export function useCreateRecetaTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post('/receta-templates', payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['receta-templates'] })
  });
}

export function useDeleteRecetaTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/receta-templates/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['receta-templates'] })
  });
}

export function useRecetas() {
  return useQuery({
    queryKey: ['recetas'],
    queryFn: async () => {
      const { data } = await api.get('/recetas');
      return data;
    }
  });
}

export function useCreateReceta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post('/recetas', payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recetas'] })
  });
}

export function useRegistrarPago() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ turnoId, ...payload }: any) => {
      const { data } = await api.post(`/turnos/${turnoId}/pago`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['accounting'] });
    }
  });
}
