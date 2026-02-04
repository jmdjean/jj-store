export type AdminPainelData = {
  mensagem: string;
};

export class AdminRepository {
  getPainelData(): AdminPainelData {
    return {
      mensagem: 'Painel administrativo liberado.',
    };
  }
}
